import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Lock, Crown, Copy, Check } from 'lucide-react';
import { SequenceStep } from '../services/ai/followUpSequencer';

interface SequenceViewerProps {
  steps: SequenceStep[];
  prospectName: string;
  sequenceType: string;
  locked?: boolean;
  upgradePrompt?: string;
  onClose: () => void;
  onActivate?: () => void;
  onEdit?: (stepNumber: number, newMessage: string) => void;
}

export function SequenceViewer({
  steps,
  prospectName,
  sequenceType,
  locked = false,
  upgradePrompt,
  onClose,
  onActivate,
  onEdit,
}: SequenceViewerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'steps' | 'schedule' | 'insights'>('steps');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editedMessage, setEditedMessage] = useState('');

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleCopy = async (message: string, stepNumber: number) => {
    await navigator.clipboard.writeText(message);
    setCopiedStep(stepNumber);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleStartEdit = (stepNumber: number, message: string) => {
    setEditingStep(stepNumber);
    setEditedMessage(message);
  };

  const handleSaveEdit = () => {
    if (editingStep !== null && onEdit) {
      onEdit(editingStep, editedMessage);
      setEditingStep(null);
      setEditedMessage('');
    }
  };

  const handleSwipe = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const swipeDistance = 50;

    if (touch.clientX < window.innerWidth / 2 - swipeDistance) {
      handleNext();
    } else if (touch.clientX > window.innerWidth / 2 + swipeDistance) {
      handlePrev();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {sequenceType.charAt(0).toUpperCase() + sequenceType.slice(1)} Sequence
            </h2>
            <p className="text-sm text-gray-600 mt-1">For {prospectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {locked && upgradePrompt ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sequence Locked</h3>
              <p className="text-gray-600 mb-8">{upgradePrompt}</p>
              <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2">
                <Crown className="w-5 h-5" />
                Upgrade to Pro or Elite
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('steps')}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${
                    activeTab === 'steps'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Steps
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${
                    activeTab === 'schedule'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`flex-1 py-3 text-center font-medium transition-colors ${
                    activeTab === 'insights'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Insights
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'steps' && (
                <div className="max-w-2xl mx-auto" onTouchEnd={handleSwipe}>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-medium text-blue-600">
                        Step {currentStep.stepNumber} of {steps.length}
                      </span>
                      <span className="text-sm text-gray-600">Day {currentStep.dayOffset}</span>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{currentStep.subject}</h3>

                    {editingStep === currentStep.stepNumber ? (
                      <div className="mb-6">
                        <textarea
                          value={editedMessage}
                          onChange={(e) => setEditedMessage(e.target.value)}
                          className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingStep(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm whitespace-pre-wrap text-gray-800 leading-relaxed">
                          {currentStep.message}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleCopy(currentStep.message, currentStep.stepNumber)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            {copiedStep === currentStep.stepNumber ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => handleStartEdit(currentStep.stepNumber, currentStep.message)}
                              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {currentStep.cta && (
                      <div className="bg-blue-600 text-white rounded-xl p-4 mb-6 text-center font-medium">
                        {currentStep.cta}
                      </div>
                    )}

                    {currentStep.coachingTip && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <Crown className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-900 mb-1">Coaching Tip</p>
                            <p className="text-sm text-yellow-800">{currentStep.coachingTip}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep.scheduledReminder?.enabled && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Scheduled for: {new Date(currentStep.scheduledReminder.sendAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-8">
                    <button
                      onClick={handlePrev}
                      disabled={currentStepIndex === 0}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Previous
                    </button>

                    <div className="flex gap-2">
                      {steps.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentStepIndex(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleNext}
                      disabled={currentStepIndex === steps.length - 1}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="max-w-2xl mx-auto space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Sequence Timeline</h3>
                  {steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{step.subject}</h4>
                            <span className="text-sm text-gray-600">Day {step.dayOffset}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{step.message}</p>
                          {step.scheduledReminder?.enabled && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(step.scheduledReminder.sendAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Total Steps</h4>
                      <p className="text-3xl font-bold text-blue-600">{steps.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                      <h4 className="text-sm font-medium text-purple-900 mb-2">Duration</h4>
                      <p className="text-3xl font-bold text-purple-600">
                        {steps[steps.length - 1]?.dayOffset || 0} days
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Sequence Overview</h4>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>This sequence is designed to engage {prospectName} through personalized follow-ups.</p>
                      <p>
                        Each message is crafted based on their interests, pain points, and ScoutScore to maximize
                        response rates.
                      </p>
                      <p>Messages are spaced strategically to maintain engagement without overwhelming them.</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <h4 className="font-semibold text-yellow-900 mb-3">Best Practices</h4>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      <li>Send messages during optimal hours (8am, 12pm, 5pm, 8pm)</li>
                      <li>Wait for response before sending next message</li>
                      <li>Personalize each message before sending</li>
                      <li>Track responses and adjust timing if needed</li>
                      <li>Be patient and respectful of their time</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {onActivate && (
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={onActivate}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
                >
                  Activate Sequence
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
