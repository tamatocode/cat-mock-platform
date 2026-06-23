import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AlertTriangle, CheckCircle, XCircle, Flag } from 'lucide-react';

export default function SubmitModal({ isOpen, onClose, onConfirm, summary }) {
  if (!summary) return null;

  const { answered, unattempted, marked, total } = summary;
  
  // High unattempted percentage warning (> 50%)
  const showWarning = unattempted > total * 0.5;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Mock Test"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Go Back to Test</Button>
          <Button variant="danger" onClick={onConfirm} className="px-6">Submit Test</Button>
        </>
      }
    >
      <div className="space-y-6">
        {showWarning && (
          <div className="bg-error-muted border border-error/50 p-4 rounded-lg flex gap-3 text-error">
            <AlertTriangle className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Are you sure?</p>
              <p className="text-sm">You have left more than half the test unattempted. You still have time left.</p>
            </div>
          </div>
        )}

        <div className="text-white mb-2">
          Please review your attempt summary before final submission:
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg p-4 rounded-lg border border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-secondary">
              <CheckCircle size={18} className="text-success" />
              <span>Answered</span>
            </div>
            <span className="text-2xl font-bold text-success">{answered}</span>
          </div>

          <div className="bg-bg p-4 rounded-lg border border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-secondary">
              <XCircle size={18} className="text-text-dim" />
              <span>Unattempted</span>
            </div>
            <span className="text-2xl font-bold text-white">{unattempted}</span>
          </div>

          <div className="bg-bg p-4 rounded-lg border border-border flex items-center justify-between col-span-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <Flag size={18} className="text-status-marked" />
              <span>Marked for Review</span>
            </div>
            <span className="text-2xl font-bold text-status-marked">{marked}</span>
          </div>
        </div>

        <p className="text-xs text-text-dim text-center uppercase tracking-wider">
          Total Questions: {total}
        </p>
      </div>
    </Modal>
  );
}
