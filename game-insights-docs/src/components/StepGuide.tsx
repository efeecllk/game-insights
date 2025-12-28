import React from 'react';

interface Step {
  title: string;
  description: string;
}

interface StepGuideProps {
  steps: Step[];
}

export default function StepGuide({ steps }: StepGuideProps) {
  return (
    <div className="step-guide">
      {steps.map((step, index) => (
        <div key={index} className="step-guide__item">
          <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{step.title}</h4>
          <p style={{ margin: 0, opacity: 0.8 }}>{step.description}</p>
        </div>
      ))}
    </div>
  );
}
