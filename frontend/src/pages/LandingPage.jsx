import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Users, Brain, Smartphone, Shield, Zap, ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function LandingPage() {
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="pb-16">
      
      {/* Hero Section with AI Background */}
      <motion.section variants={itemVariants} className="relative rounded-3xl overflow-hidden mb-16 border border-zinc-800">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-screen"
          style={{ backgroundImage: 'url(/landing-bg.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/60 to-zinc-950" />
        
        <div className="relative z-10 text-center py-32 px-4 flex flex-col items-center">
          <motion.div whileHover={{ scale: 1.05 }} className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold text-emerald-500 backdrop-blur-md">
            <Zap className="w-4 h-4" /> Side-Face Recognition Powered by 3 AI Models
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-zinc-100">
            Intelligent Face <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Recognition Platform</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Train custom face recognition models with just a few photos. Works with side-face profiles,
            runs inference across three models simultaneously, and deploys to web and mobile seamlessly.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-8">
              <Link to="/upload">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-zinc-950/50 backdrop-blur-md px-8">
              <Link to="/support">
                Learn How It Works
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="mb-24">
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3 text-zinc-100">How It Works</h2>
          <p className="text-zinc-400 text-lg">Three simple steps to train and deploy your own face recognition system</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard
            number="01"
            icon={<Camera className="w-7 h-7" />}
            title="Upload Face Photos"
            description="Upload frontal, left, and right profile images of each person. The system intelligently detects faces and accepts 1-20 photos per person."
          />
          <StepCard
            number="02"
            icon={<Brain className="w-7 h-7" />}
            title="Train Models"
            description="Two models train simultaneously: DeepFace embeddings and SOTA MobileNetV2 — optimized for side-face profiles."
          />
          <StepCard
            number="03"
            icon={<Zap className="w-7 h-7" />}
            title="Recognize Faces"
            description="Use the webcam or upload images to identify faces. An advanced ensemble system combines all 3 models for maximum accuracy."
          />
        </div>
      </motion.section>

      {/* Features */}
      <motion.section variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="mb-24">
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3 text-zinc-100">Platform Features</h2>
          <p className="text-zinc-400 text-lg">Built for accuracy, speed, and seamless integration</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard icon={<Brain className="w-5 h-5" />} title="2-Model Ensemble" desc="Combines DeepFace and MobileNetV2 predictions for higher accuracy with weighted voting." />
          <FeatureCard icon={<Camera className="w-5 h-5" />} title="Side-Face Support" desc="Specialized for profile/side-face detection using MediaPipe BlazeFace and custom data augmentation." />
          <FeatureCard icon={<Smartphone className="w-5 h-5" />} title="Mobile App" desc="React Native mobile app with live camera recognition. Connect directly to your local server over WiFi." />
          <FeatureCard icon={<Users className="w-5 h-5" />} title="Multi-Person" desc="Register unlimited people. Each person can have multiple face angles for highly robust accuracy." />
          <FeatureCard icon={<Zap className="w-5 h-5" />} title="Real-Time" desc="Fast inference on CPU. MobileNetV2 runs predictions in under 100ms on standard modern hardware." />
          <FeatureCard icon={<Shield className="w-5 h-5" />} title="Offline Capable" desc="All processing happens locally. No cloud dependency, ensuring no sensitive data ever leaves your network." />
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center py-16 px-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-zinc-100">Ready to start recognizing faces?</h2>
        <p className="text-zinc-400 mb-8 max-w-xl mx-auto text-lg">
          Upload photos of the people you want to recognize, train the ensemble models, and start testing in minutes.
        </p>
        <Button asChild size="lg" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
          <Link to="/upload">
            Register a Person <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </motion.section>

    </motion.div>
  );
}

function StepCard({ number, icon, title, description }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4 }}>
      <Card className="relative overflow-hidden h-full bg-zinc-900/40 border-zinc-800">
        <CardContent className="p-8">
          <div className="absolute -top-4 -right-4 text-8xl font-black opacity-[0.03] text-zinc-100 pointer-events-none select-none">
            {number}
          </div>
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-3 text-zinc-100">{title}</h3>
          <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }}>
      <Card className="h-full bg-zinc-900/40 border-zinc-800">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 border border-zinc-700/50">
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-zinc-100 mb-1">{title}</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
