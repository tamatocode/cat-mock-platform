import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import ImageUpload from '../components/ui/ImageUpload';
import { useToast } from '../components/ui/Toast';
import { generateId, parseTags, SECTIONS, DIFFICULTIES } from '../lib/utils';
import { saveQuestion, updateQuestion, getQuestionById } from '../lib/storage';

export default function AddQuestion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const toast = useToast();

  const isEditMode = Boolean(editId);

  const [formData, setFormData] = useState({
    section: 'VARC',
    type: 'MCQ',
    difficulty: 'Medium',
    tags: '',
    questionText: '',
    questionImage: null,
    options: [
      { id: 'A', text: '', image: null },
      { id: 'B', text: '', image: null },
      { id: 'C', text: '', image: null },
      { id: 'D', text: '', image: null },
    ],
    correctOption: null,
    correctAnswer: '',
    explanation: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      const q = getQuestionById(editId);
      if (q) {
        setFormData({
          ...q,
          tags: q.tags?.join(', ') || '',
        });
      } else {
        toast.error('Question not found');
        navigate('/add-question');
      }
    }
  }, [editId, navigate, toast, isEditMode]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index][field] = value;
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.section) newErrors.section = 'Required';
    if (!formData.type) newErrors.type = 'Required';
    if (!formData.difficulty) newErrors.difficulty = 'Required';
    if (!formData.questionText.trim() && !formData.questionImage) {
      newErrors.questionText = 'Question text or image is required';
    }

    if (formData.type === 'MCQ') {
      if (!formData.correctOption) {
        newErrors.correctOption = 'Please select a correct option';
      }
      formData.options.forEach((opt, idx) => {
        if (!opt.text.trim() && !opt.image) {
          newErrors[`option_${idx}`] = 'Option content is required';
        }
      });
    } else {
      if (formData.correctAnswer === '') {
        newErrors.correctAnswer = 'Correct answer is required';
      } else if (isNaN(Number(formData.correctAnswer))) {
        newErrors.correctAnswer = 'Must be a valid number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (addAnother = false) => {
    if (!validate()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    const questionToSave = {
      ...formData,
      id: isEditMode ? editId : generateId(),
      createdAt: isEditMode ? formData.createdAt : Date.now(),
      tags: parseTags(formData.tags),
    };

    if (formData.type === 'TITA') {
      questionToSave.options = undefined;
      questionToSave.correctOption = null;
      questionToSave.correctAnswer = String(Number(formData.correctAnswer));
    } else {
      questionToSave.correctAnswer = null;
    }

    let success = false;
    if (isEditMode) {
      success = updateQuestion(editId, questionToSave);
      if (success) toast.success('Question updated successfully!');
    } else {
      success = saveQuestion(questionToSave);
      if (success) toast.success('Question added successfully!');
    }

    if (!success) {
      toast.error('Failed to save question. Storage might be full.');
      return;
    }

    if (addAnother && !isEditMode) {
      // Reset form but keep section and type
      setFormData((prev) => ({
        ...prev,
        tags: '',
        questionText: '',
        questionImage: null,
        options: [
          { id: 'A', text: '', image: null },
          { id: 'B', text: '', image: null },
          { id: 'C', text: '', image: null },
          { id: 'D', text: '', image: null },
        ],
        correctOption: null,
        correctAnswer: '',
        explanation: '',
      }));
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/question-bank');
    }
  };

  const parsedTags = parseTags(formData.tags);

  return (
    <PageShell 
      title={isEditMode ? 'Edit Question' : 'Add Question'} 
      subtitle={isEditMode ? 'Modify existing question details' : 'Create a new question for your mock tests'}
    >
      <div className="space-y-6 max-w-4xl">
        <Card padding>
          <h2 className="text-lg font-semibold mb-4 text-white">Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Section"
              value={formData.section}
              onChange={(e) => handleChange('section', e.target.value)}
              options={SECTIONS.map(s => ({ value: s, label: s }))}
              error={errors.section}
            />
            
            <div>
              <label className="block text-sm font-medium text-text mb-1">Question Type</label>
              <div className="flex bg-bg rounded-md p-1 border border-border">
                {['MCQ', 'TITA'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleChange('type', type)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                      formData.type === type 
                        ? 'bg-surface text-accent shadow-sm' 
                        : 'text-text hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Difficulty</label>
              <div className="flex bg-bg rounded-md p-1 border border-border">
                {DIFFICULTIES.map(diff => (
                  <button
                    key={diff}
                    onClick={() => handleChange('difficulty', diff)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                      formData.difficulty === diff 
                        ? 'bg-surface text-white shadow-sm' 
                        : 'text-text hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Input
              label="Tags (comma separated)"
              placeholder="e.g. Algebra, Reading Comprehension, Puzzles"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
            />
            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {parsedTags.map(tag => (
                  <Badge key={tag} variant="custom" className="bg-surface-active text-text-secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card padding>
          <h2 className="text-lg font-semibold mb-4 text-white">Question Content</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Question Text</label>
              <textarea
                className={`w-full bg-surface-active border ${errors.questionText ? 'border-error' : 'border-border'} rounded-md p-3 text-text focus:outline-none focus:border-accent min-h-[120px] resize-y`}
                placeholder="Enter the question text here..."
                value={formData.questionText}
                onChange={(e) => handleChange('questionText', e.target.value)}
              />
              {errors.questionText && <p className="text-error text-xs mt-1">{errors.questionText}</p>}
            </div>

            <ImageUpload
              label="Question Image (Optional)"
              value={formData.questionImage}
              onChange={(val) => handleChange('questionImage', val)}
            />
          </div>
        </Card>

        <Card padding>
          <h2 className="text-lg font-semibold mb-4 text-white">
            {formData.type === 'MCQ' ? 'Options & Answer' : 'Correct Answer'}
          </h2>
          
          {formData.type === 'MCQ' ? (
            <div className="space-y-6">
              {formData.options.map((opt, idx) => (
                <div key={opt.id} className="flex gap-4 items-start p-4 bg-bg rounded-md border border-border">
                  <div className="pt-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={formData.correctOption === opt.id}
                      onChange={() => handleChange('correctOption', opt.id)}
                      className="w-4 h-4 text-accent focus:ring-accent accent-accent"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-secondary w-6">{opt.id}.</span>
                      <div className="flex-1">
                        <Input
                          placeholder={`Option ${opt.id} text`}
                          value={opt.text}
                          onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                          error={errors[`option_${idx}`]}
                        />
                      </div>
                    </div>
                    <ImageUpload
                      label={`Option ${opt.id} Image (Optional)`}
                      value={opt.image}
                      onChange={(val) => handleOptionChange(idx, 'image', val)}
                    />
                  </div>
                </div>
              ))}
              {errors.correctOption && <p className="text-error text-sm">{errors.correctOption}</p>}
            </div>
          ) : (
            <div>
              <Input
                label="Numerical Answer"
                placeholder="Enter correct numerical value"
                type="number"
                step="any"
                value={formData.correctAnswer}
                onChange={(e) => handleChange('correctAnswer', e.target.value)}
                error={errors.correctAnswer}
              />
              <p className="text-xs text-text-secondary mt-1">Accepts decimals. Handled with 0.01 tolerance during evaluation.</p>
            </div>
          )}
        </Card>

        <Card padding>
          <h2 className="text-lg font-semibold mb-4 text-white">Explanation (Optional)</h2>
          <textarea
            className="w-full bg-surface-active border border-border rounded-md p-3 text-text focus:outline-none focus:border-accent min-h-[100px] resize-y"
            placeholder="Explain the solution..."
            value={formData.explanation}
            onChange={(e) => handleChange('explanation', e.target.value)}
          />
        </Card>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          {!isEditMode && (
            <Button variant="secondary" onClick={() => handleSave(true)}>
              Save & Add Another
            </Button>
          )}
          <Button variant="primary" onClick={() => handleSave(false)}>
            {isEditMode ? 'Update Question' : 'Save Question'}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
