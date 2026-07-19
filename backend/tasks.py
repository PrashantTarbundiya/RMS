import os
import sys
from io import StringIO
import threading
from celery import Celery
from config_utils import get_org_config
from org_storage import get_dataset_cleaned_dir
import logging

logger = logging.getLogger('celery.task')

# Basic Celery app setup
# Defaulting to Redis, but can be overridden via environment variables
broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
result_backend = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

celery_app = Celery('rms_tasks', broker=broker_url, backend=result_backend)

# Optional: Configuration for Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True
)

class CeleryStringWriter(StringIO):
    """Captures stdout from training and updates the Celery task state."""
    def __init__(self, task):
        super().__init__()
        self.task = task
        self.logs = []
        self._lock = threading.Lock()

    def write(self, text):
        if text.strip():
            with self._lock:
                self.logs.append(text.strip())
                # Only keep last 100 lines to prevent metadata bloat
                if len(self.logs) > 100:
                    self.logs = self.logs[-100:]
                
                # Update Celery custom state
                self.task.update_state(
                    state='TRAINING',
                    meta={'logs': self.logs, 'progress': 50}  # Simplified progress
                )
        return super().write(text)


@celery_app.task(bind=True)
def retrain_model_task(self, person_name, epochs, org_id):
    """
    Celery task that executes the SOTA MobileNetV2 fine-tuning.
    """
    from add_person_utils import update_sota_model
    from server import reload_org_models
    
    logger.info(f"Starting background model refinement for {person_name} (Epochs: {epochs}, Org: {org_id})")
    
    self.update_state(state='STARTING', meta={'logs': ['Task started...'], 'progress': 0})
    
    old_stdout = sys.stdout
    writer = CeleryStringWriter(self)
    sys.stdout = writer
    
    try:
        org_dataset_dir = get_dataset_cleaned_dir(org_id)
        update_sota_model(person_name, dataset_dir=org_dataset_dir, num_epochs=epochs, org_id=org_id)
        
        print("\n--- Pipeline Completed ---")
        self.update_state(state='SUCCESS', meta={'logs': writer.logs, 'progress': 100})
        
        # Note: Reloading models here only reloads them in the Celery worker process.
        # The main web server (Flask/Gunicorn) needs its own mechanism to know when to reload,
        # but for now, we leave it as is or rely on the /api/train/status endpoint to trigger reload.
        
        return {'status': 'completed', 'person': person_name}
    except Exception as e:
        print(f"\n--- Pipeline Error ---")
        print(str(e))
        self.update_state(state='FAILURE', meta={'logs': writer.logs, 'error': str(e)})
        raise e
    finally:
        sys.stdout = old_stdout
