import gradio as gr
from PIL import Image
from .inference import FaceRecognizer

# Initialize the inference recognizer (will load weights if available)
recognizer = FaceRecognizer(model_path="best_face_model.pth", classes_path="class_names.txt")

def process_image(input_image):
    """
    Callback function called by Gradio when an image is submitted (Upload or Webcam).
    """
    if input_image is None:
        return None, "⚠️ Please upload an image or turn on the webcam feed first."
        
    # Convert incoming Numpy array (Gradio standard format) to PIL Image for PyTorch
    try:
        pil_img = Image.fromarray(input_image)
    except Exception as e:
        return None, f"⚠️ Error parsing image: {str(e)}"
    
    # Run the group image through Custom PyTorch CNN
    gallery_items = recognizer.predict_group(pil_img)
    
    warning = ""
    if len(gallery_items) > 0 and "[UNTRAINED]" in gallery_items[0][1]:
        warning = "### ⚠️ WARNING: Model is Untrained!\n*(Train the model using `train.py` to get real values)*\n\n"
        
    result_text = f"{warning}**Detected {len(gallery_items)} face(s) in the group.**"
    if len(gallery_items) == 1 and "No faces detected" in gallery_items[0][1]:
        result_text = f"{warning}**No faces detected in the image.**"
    
    # Return populated gallery and result text
    return gallery_items, result_text

# Define custom web styling / layout using Gradio Blocks
with gr.Blocks(title="Custom Face CNN Demo") as demo:
    gr.Markdown(
        """
        # 🤖 Custom PyTorch Face CNN (Group Mode)
        Upload a group photo or use the Live Web Camera. The system will detect all faces and output a grid with their recognized names and confidence!
        """
    )
    
    with gr.Row():
        with gr.Column():
            # gr.Image seamlessly supports BOTH File Uploads and Live Webcam
            input_image = gr.Image(sources=["upload", "webcam"], label="Input Face Image (Upload or Live Feed)")
            submit_btn = gr.Button("🔍 Run Group Recognition", variant="primary")
            gr.Markdown("*It uses OpenCV Haar cascades to find faces and feeds them to the CNN.*")
            
        with gr.Column():
            # Use a Gallery component to show the grid of faces with their names
            output_gallery = gr.Gallery(label="Detected Faces Grid", columns=3, height="auto")
            output_text = gr.Markdown(label="Recognition State", value="*Awaiting inference...*")

    # Connect the UI elements to the python processing backend
    submit_btn.click(
        fn=process_image,
        inputs=[input_image],
        outputs=[output_gallery, output_text]
    )

if __name__ == "__main__":
    print("Deploying Live Demo interface on http://127.0.0.1:7860/")
    # Launch standard non-sharing mode over local port 7860
    demo.launch(server_name="127.0.0.1", server_port=7860, share=False)
