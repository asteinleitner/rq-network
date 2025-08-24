import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

// =============================================================================
// ALGORITHM PROCESSING ENGINE (Core Logic)
// =============================================================================

// Core algorithm processing engine
const processAlgorithmRules = (rules, data) => {
  for (const rule of rules) {
    const conditionResults = rule.conditions.map(condition => {
      const fieldValue = data[condition.field];
      return evaluateCondition(condition, fieldValue);
    });

    const ruleMatches = rule.logic === 'AND' 
      ? conditionResults.every(result => result)
      : conditionResults.some(result => result);

    if (ruleMatches) {
      return {
        rule: rule,
        level: rule.result.level,
        diagnosticMessage: rule.result.diagnosticMessage,
        treatmentRecommendation: rule.result.treatmentRecommendation,
        matchedConditions: rule.conditions,
        processedData: data
      };
    }
  }

  return {
    level: 'GREEN',
    diagnosticMessage: 'No specific conditions met - normal range',
    treatmentRecommendation: 'Continue current approach and monitor',
    rule: null,
    processedData: data
  };
};

// Condition evaluation
const evaluateCondition = (condition, value) => {
  switch (condition.operator) {
    case '>=':
      return parseFloat(value) >= parseFloat(condition.value);
    case '<=':
      return parseFloat(value) <= parseFloat(condition.value);
    case 'equals':
      return value === condition.value;
    case 'contains':
      return String(value).includes(condition.value);
    case 'not_equals':
      return value !== condition.value;
    default:
      return false;
  }
};

// Patient response processing capability
const processPatientFormSubmission = (issues, patientResponses) => {
  const results = {};
  
  issues.forEach(issue => {
    const issueResponses = patientResponses[issue.id] || {};
    
    // Process patient track algorithm
    const patientResult = processAlgorithmRules(
      issue.patient?.algorithmRules || [], 
      issueResponses
    );
    
    // Process physician track algorithm  
    const physicianResult = processAlgorithmRules(
      issue.physician?.algorithmRules || [], 
      issueResponses
    );
    
    results[issue.id] = {
      patient: patientResult,
      physician: physicianResult,
      overallRisk: getHighestRiskLevel(patientResult.level, physicianResult.level)
    };
  });
  
  return results;
};

// Helper function to determine highest risk level
const getHighestRiskLevel = (level1, level2) => {
  const riskOrder = { 'GREEN': 1, 'YELLOW': 2, 'RED': 3 };
  const risk1 = riskOrder[level1] || 1;
  const risk2 = riskOrder[level2] || 1;
  
  const highestRisk = Math.max(risk1, risk2);
  return Object.keys(riskOrder).find(key => riskOrder[key] === highestRisk);
};

// =============================================================================
// ALGORITHM BUILDER COMPONENT
// =============================================================================
const AlgorithmBuilder = ({ 
  issue, 
  track, 
  isOpen = false, 
  onClose, 
  onSaveAlgorithm,
  styling = {}
}) => {
  const [algorithmRules, setAlgorithmRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [testData, setTestData] = useState({});

  const styles = {
    modal: styling.modal || "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
    modalContent: styling.modalContent || "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden",
    header: styling.header || "border-b border-gray-200 px-6 py-4",
    button: styling.button || "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors",
    ...styling
  };

  React.useEffect(() => {
    if (issue && track) {
      const existingRules = issue[track]?.algorithmRules || [];
      setAlgorithmRules(existingRules);
      
      // Initialize test data
      const fields = getAvailableFields();
      const initialTestData = {};
      fields.forEach(field => {
        if (!testData[field.id]) {
          switch (field.type) {
            case 'number':
              initialTestData[field.id] = '';
              break;
            case 'select':
            case 'radio':
              initialTestData[field.id] = field.options.length > 0 ? field.options[0].value : '';
              break;
            default:
              initialTestData[field.id] = '';
          }
        }
      });
      setTestData(prev => ({ ...initialTestData, ...prev }));
    }
  }, [issue, track]);

  const getAvailableFields = () => {
    if (!issue || !issue[track]) {
      return [];
    }
    
    const fields = [];
    
    // Add sub-questions as fields
    if (issue[track].subQuestions) {
      issue[track].subQuestions.forEach(subQ => {
        fields.push({
          id: subQ.id,
          label: subQ.label || 'Untitled Question',
          type: subQ.inputType || 'text',
          options: subQ.inputOptions || [],
          source: 'subQuestion'
        });
      });
    }
    
    // Add lab tests as fields (only for physician track)
    if (track === 'physician' && issue[track].labTests) {
      issue[track].labTests.forEach(labTest => {
        fields.push({
          id: `lab_${labTest.replace(/\s+/g, '_').toLowerCase()}`,
          label: `${labTest} (Lab Test)`,
          type: 'number',
          options: [],
          source: 'labTest',
          originalLabName: labTest
        });
      });
    }
    
    return fields;
  };

  const addAlgorithmRule = () => {
    const newRule = {
      id: Date.now(),
      conditions: [{ field: '', operator: '>=', value: '' }],
      logic: 'AND',
      result: { 
        level: 'GREEN', 
        diagnosticMessage: '', 
        treatmentRecommendation: '' 
      }
    };
    setAlgorithmRules(prev => [...prev, newRule]);
    setEditingRule(newRule.id);
  };

  const updateAlgorithmRule = (ruleId, updates) => {
    setAlgorithmRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const deleteAlgorithmRule = (ruleId) => {
    setAlgorithmRules(prev => prev.filter(rule => rule.id !== ruleId));
    if (editingRule === ruleId) setEditingRule(null);
  };

  const addCondition = (ruleId) => {
    setAlgorithmRules(prev => prev.map(rule =>
      rule.id === ruleId
        ? { ...rule, conditions: [...rule.conditions, { field: '', operator: '>=', value: '' }] }
        : rule
    ));
  };

  const updateCondition = (ruleId, conditionIndex, updates) => {
    setAlgorithmRules(prev => prev.map(rule =>
      rule.id === ruleId
        ? {
            ...rule,
            conditions: rule.conditions.map((condition, index) =>
              index === conditionIndex ? { ...condition, ...updates } : condition
            )
          }
        : rule
    ));
  };

  const removeCondition = (ruleId, conditionIndex) => {
    setAlgorithmRules(prev => prev.map(rule =>
      rule.id === ruleId
        ? { ...rule, conditions: rule.conditions.filter((_, index) => index !== conditionIndex) }
        : rule
    ));
  };

  const updateTestData = (fieldId, value) => {
    setTestData(prev => ({ ...prev, [fieldId]: value }));
  };

  const generateRandomTestData = () => {
    const randomData = {};
    getAvailableFields().forEach(field => {
      switch (field.type) {
        case 'number':
          randomData[field.id] = Math.floor(Math.random() * 50) + 20;
          break;
        case 'select':
        case 'radio':
          if (field.options.length > 0) {
            randomData[field.id] = field.options[Math.floor(Math.random() * field.options.length)].value;
          }
          break;
        default:
          randomData[field.id] = 'Sample Value ' + Math.floor(Math.random() * 100);
      }
    });
    setTestData(randomData);
  };

  const testAlgorithm = () => {
    const results = processAlgorithmRules(algorithmRules, testData);
    setTestResults(results);
  };

  const handleSaveAlgorithm = () => {
    if (onSaveAlgorithm) {
      onSaveAlgorithm(algorithmRules);
    }
    onClose();
  };

  const availableFields = getAvailableFields();

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Algorithm Builder</h2>
              <p className="text-sm text-gray-600 mt-1">
                Issue: {issue?.patient?.title || issue?.physician?.title} | Track: {track}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {availableFields.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No questions configured for this track yet.</div>
              <div className="text-sm text-gray-400">
                Add questions in the issue card first, then create algorithm rules.
              </div>
            </div>
          ) : (
            <div>
              {/* Available Fields Display */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Available Fields:</div>
                <div className="grid grid-cols-2 gap-2">
                  {availableFields.map(field => (
                    <div key={field.id} className="text-sm text-gray-600">
                      {field.label} ({field.type})
                      {field.source === 'labTest' && (
                        <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          Lab
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Data Input Section */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Test Data Input</h3>
                  <button
                    onClick={generateRandomTestData}
                    className={styles.button}
                  >
                    Generate Random Data
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableFields.map(field => (
                    <div key={field.id} className="bg-white p-3 rounded border">
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        {field.label} ({field.type})
                      </label>
                      
                      {field.type === 'number' ? (
                        <input
                          type="number"
                          value={testData[field.id] || ''}
                          onChange={(e) => updateTestData(field.id, e.target.value)}
                          placeholder="Enter number"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : field.type === 'select' || field.type === 'radio' ? (
                        <select
                          value={testData[field.id] || ''}
                          onChange={(e) => updateTestData(field.id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Select option</option>
                          {field.options.map((option, idx) => (
                            <option key={idx} value={option.value}>
                              {option.label} ({option.riskLevel})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={testData[field.id] || ''}
                          onChange={(e) => updateTestData(field.id, e.target.value)}
                          placeholder="Enter text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Algorithm Rules Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Algorithm Rules</h3>
                  <button
                    onClick={addAlgorithmRule}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    Add Rule
                  </button>
                </div>

                {algorithmRules.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-500 mb-2">No algorithm rules yet</div>
                    <div className="text-sm text-gray-400">Click "Add Rule" to create your first algorithm rule</div>
                  </div>
                ) : (
                  <div>
                    {algorithmRules.map((rule, index) => (
                      <div key={rule.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-medium text-gray-800">Rule {index + 1}</div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingRule(editingRule === rule.id ? null : rule.id)}
                              className={`px-3 py-1 rounded text-sm transition-colors ${
                                editingRule === rule.id
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {editingRule === rule.id ? 'Done' : 'Edit'}
                            </button>
                            <button
                              onClick={() => deleteAlgorithmRule(rule.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {editingRule === rule.id ? (
                          <div>
                            {/* Rule editing interface */}
                            <div className="mb-3">
                              <div className="text-sm font-medium text-gray-700 mb-2">Conditions:</div>
                              {rule.conditions.map((condition, conditionIndex) => (
                                <div key={conditionIndex} className="grid grid-cols-12 gap-2 items-center mb-2">
                                  <div className="col-span-4">
                                    <select
                                      value={condition.field}
                                      onChange={(e) => updateCondition(rule.id, conditionIndex, { field: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">Select Field</option>
                                      {availableFields.map(field => (
                                        <option key={field.id} value={field.id}>
                                          {field.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="col-span-3">
                                    <select
                                      value={condition.operator}
                                      onChange={(e) => updateCondition(rule.id, conditionIndex, { operator: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value=">=">&gt;=</option>
                                      <option value="<=">&lt;=</option>
                                      <option value="equals">equals</option>
                                      <option value="contains">contains</option>
                                      <option value="not_equals">not equals</option>
                                    </select>
                                  </div>

                                  <div className="col-span-4">
                                    <input
                                      type="text"
                                      value={condition.value}
                                      onChange={(e) => updateCondition(rule.id, conditionIndex, { value: e.target.value })}
                                      placeholder="Value"
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </div>

                                  <div className="col-span-1">
                                    <button
                                      onClick={() => removeCondition(rule.id, conditionIndex)}
                                      className="text-red-500 hover:text-red-700 text-sm p-1"
                                      disabled={rule.conditions.length <= 1}
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => addCondition(rule.id)}
                                className={styles.button}
                              >
                                Add Condition
                              </button>
                            </div>

                            {rule.conditions.length > 1 && (
                              <div className="mb-3">
                                <label className="text-sm font-medium text-gray-700 block mb-1">Logic:</label>
                                <select
                                  value={rule.logic}
                                  onChange={(e) => updateAlgorithmRule(rule.id, { logic: e.target.value })}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="AND">AND (all conditions must be true)</option>
                                  <option value="OR">OR (any condition can be true)</option>
                                </select>
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Risk Level:</label>
                                <select
                                  value={rule.result.level}
                                  onChange={(e) => updateAlgorithmRule(rule.id, { 
                                    result: { ...rule.result, level: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="GREEN">GREEN (Low Risk)</option>
                                  <option value="YELLOW">YELLOW (Medium Risk)</option>
                                  <option value="RED">RED (High Risk)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Diagnostic Message:</label>
                                <input
                                  type="text"
                                  value={rule.result.diagnosticMessage || ''}
                                  onChange={(e) => updateAlgorithmRule(rule.id, { 
                                    result: { ...rule.result, diagnosticMessage: e.target.value }
                                  })}
                                  placeholder="Diagnostic assessment"
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Treatment Recommendation:</label>
                                <input
                                  type="text"
                                  value={rule.result.treatmentRecommendation || ''}
                                  onChange={(e) => updateAlgorithmRule(rule.id, { 
                                    result: { ...rule.result, treatmentRecommendation: e.target.value }
                                  })}
                                  placeholder="Treatment action"
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            <div className="mb-1">
                              <strong>Conditions:</strong> {rule.conditions.length} condition(s)
                              {rule.conditions.length > 1 && (
                                <span className="ml-1">with {rule.logic} logic</span>
                              )}
                            </div>
                            <div className="mb-1">
                              <strong>Result:</strong> 
                              <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                                rule.result.level === 'RED' ? 'bg-red-100 text-red-800' :
                                rule.result.level === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {rule.result.level}
                              </span>
                            </div>
                            {rule.result.diagnosticMessage && (
                              <div className="mb-1"><strong>Diagnosis:</strong> {rule.result.diagnosticMessage}</div>
                            )}
                            {rule.result.treatmentRecommendation && (
                              <div><strong>Treatment:</strong> {rule.result.treatmentRecommendation}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Test Algorithm Section */}
              {algorithmRules.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Test Algorithm</h3>
                    <button
                      onClick={testAlgorithm}
                      className={styles.button}
                    >
                      Run Test
                    </button>
                  </div>

                  {testResults && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-gray-700">Test Result:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          testResults.level === 'RED' ? 'bg-red-100 text-red-800' :
                          testResults.level === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {testResults.level}
                        </span>
                      </div>
                      
                      {testResults.diagnosticMessage && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Diagnosis:</strong> {testResults.diagnosticMessage}
                        </div>
                      )}
                      {testResults.treatmentRecommendation && (
                        <div className="text-sm text-gray-600">
                          <strong>Treatment:</strong> {testResults.treatmentRecommendation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors">
              Cancel
            </button>
            <button onClick={handleSaveAlgorithm} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors">
              Save Algorithm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// ISSUE MANAGER COMPONENT
// =============================================================================
const IssueManager = forwardRef(({ 
  onOpenAlgorithmBuilder, 
  onIssuesChange,
  initialButtonTypes = [],
  styling = {}
}, ref) => {
  const [buttonTypes, setButtonTypes] = useState(initialButtonTypes.length > 0 ? initialButtonTypes : [
    {
      id: 'age',
      patientTitle: 'How old are you?',
      physicianTitle: 'Age and Duration Assessment',
      type: 'number',
      patientContext: 'Age affects your fertility potential. Women have peak fertility in their twenties and early thirties.',
      physicianContext: 'Maternal age is the most significant predictor of fertility outcomes.',
      defaultLabTests: ['FSH', 'AMH', 'TSH', 'Prolactin']
    },
    {
      id: 'duration',
      patientTitle: 'How long have you been trying to conceive?',
      physicianTitle: 'Duration of Subfertility',
      type: 'select',
      patientContext: 'Most couples conceive within 12 months of trying.',
      physicianContext: 'Duration determines urgency of evaluation.',
      defaultLabTests: ['FSH', 'AMH']
    }
  ]);

  const [questions, setQuestions] = useState([]);
  const [questionCounter, setQuestionCounter] = useState(0);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [newLabTest, setNewLabTest] = useState('');
  const [newQuestionType, setNewQuestionType] = useState('');
  const [showNewQuestionInput, setShowNewQuestionInput] = useState(false);
  const [autoFillNotification, setAutoFillNotification] = useState(null);

  const styles = {
    sidebar: styling.sidebar || "col-span-1 bg-gray-50 p-6 border-r border-gray-200",
    questionCard: styling.questionCard || "border-2 border-gray-200 hover:border-green-400 hover:shadow-md rounded-xl p-6 transition-all bg-white",
    button: styling.button || "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors",
    ...styling
  };

  const addQuestion = useCallback((type) => {
    const buttonType = buttonTypes.find(b => b.id === type);
    if (!buttonType) return;
    
    const newQuestionCounter = questionCounter + 1;
    const newQuestion = {
      id: newQuestionCounter,
      type: type,
      patient: {
        title: buttonType.patientTitle,
        context: buttonType.patientContext,
        inputType: buttonType.type,
        inputOptions: [],
        algorithmRules: [],
        subQuestions: []
      },
      physician: {
        title: buttonType.physicianTitle,
        context: buttonType.physicianContext,
        inputType: buttonType.type,
        labTests: [...buttonType.defaultLabTests],
        inputOptions: [],
        algorithmRules: [],
        subQuestions: []
      }
    };
    
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    setQuestionCounter(newQuestionCounter);
    if (onIssuesChange) onIssuesChange(updatedQuestions);
  }, [buttonTypes, questions, questionCounter, onIssuesChange]);

  const updateQuestion = useCallback((id, track, field, value) => {
    const updatedQuestions = questions.map(q =>
      q.id === id ? { ...q, [track]: { ...q[track], [field]: value } } : q
    );
    setQuestions(updatedQuestions);
    if (onIssuesChange) onIssuesChange(updatedQuestions);
  }, [questions, onIssuesChange]);

  const deleteQuestion = useCallback((id) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    setQuestions(updatedQuestions);
    setQuestionToDelete(null);
    if (onIssuesChange) onIssuesChange(updatedQuestions);
  }, [questions, onIssuesChange]);

  // Sub-question management
  const addSubQuestion = useCallback((questionId, track) => {
    const newSubQuestion = {
      id: Date.now(),
      label: '',
      inputType: 'text',
      inputOptions: [],
      required: true
    };
    
    const question = questions.find(q => q.id === questionId);
    const currentSubQuestions = question[track].subQuestions || [];
    updateQuestion(questionId, track, 'subQuestions', [...currentSubQuestions, newSubQuestion]);
  }, [questions, updateQuestion]);

  const removeSubQuestion = useCallback((questionId, track, subQuestionId) => {
    const question = questions.find(q => q.id === questionId);
    const currentSubQuestions = question[track].subQuestions || [];
    updateQuestion(questionId, track, 'subQuestions', currentSubQuestions.filter(sq => sq.id !== subQuestionId));
  }, [questions, updateQuestion]);

  const updateSubQuestion = useCallback((questionId, track, subQuestionId, field, value) => {
    const question = questions.find(q => q.id === questionId);
    const currentSubQuestions = question[track].subQuestions || [];
    const updatedSubQuestions = currentSubQuestions.map(sq =>
      sq.id === subQuestionId ? { ...sq, [field]: value } : sq
    );
    updateQuestion(questionId, track, 'subQuestions', updatedSubQuestions);
  }, [questions, updateQuestion]);

  // Auto-fill Physician Track from Patient Track
  const autoFillPhysicianTrack = useCallback((questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.patient) return;

    const patientData = question.patient;
    
    const enhanceForClinical = (text, type = 'title') => {
      if (!text) return text;
      
      const enhancements = {
        title: {
          'How old are you?': 'Maternal Age Assessment',
          'How long have you been trying to conceive?': 'Duration of Subfertility Evaluation',
          'menstrual': 'Menstrual Cycle Analysis',
          'medical history': 'Medical History Assessment',
          'symptoms': 'Clinical Symptom Evaluation'
        },
        context: {
          'patient-friendly': 'clinical significance',
          'helps determine': 'indicates clinical priority for',
          'important for': 'critical clinical factor in',
          'may affect': 'directly impacts clinical outcomes in'
        }
      };

      let enhanced = text;
      Object.entries(enhancements[type] || {}).forEach(([pattern, replacement]) => {
        enhanced = enhanced.replace(new RegExp(pattern, 'gi'), replacement);
      });
      
      if (type === 'context' && enhanced === text) {
        enhanced = `Clinical Assessment: ${text}. This information guides diagnostic workup and treatment planning.`;
      }
      
      return enhanced;
    };

    const enhancedPhysicianData = {
      ...question.physician,
      title: enhanceForClinical(patientData.title, 'title'),
      context: enhanceForClinical(patientData.context, 'context'),
      subQuestions: patientData.subQuestions.map(subQ => ({
        ...subQ,
        id: Date.now() + Math.random(),
        label: subQ.label ? enhanceForClinical(subQ.label, 'title') : subQ.label,
        inputOptions: subQ.inputOptions?.map(option => ({
          ...option,
          label: option.label
        })) || []
      }))
    };

    updateQuestion(questionId, 'physician', 'title', enhancedPhysicianData.title);
    updateQuestion(questionId, 'physician', 'context', enhancedPhysicianData.context);
    updateQuestion(questionId, 'physician', 'subQuestions', enhancedPhysicianData.subQuestions);

    setAutoFillNotification(questionId);
    setTimeout(() => setAutoFillNotification(null), 3000);
  }, [questions, updateQuestion]);

  // API for parent component
  const getFormConfiguration = useCallback(() => {
    return { buttonTypes, questions, questionCounter };
  }, [buttonTypes, questions, questionCounter]);

  const updateQuestionAlgorithm = useCallback((questionId, track, algorithmRules) => {
    updateQuestion(questionId, track, 'algorithmRules', algorithmRules);
  }, [updateQuestion]);

  const getQuestionById = useCallback((questionId) => {
    return questions.find(q => q.id === questionId);
  }, [questions]);

  const processFormResponses = useCallback((patientResponses) => {
    return processPatientFormSubmission(questions, patientResponses);
  }, [questions]);

  useImperativeHandle(ref, () => ({
    getFormConfiguration,
    updateQuestionAlgorithm,
    updateQuestion,
    getQuestionById,
    processFormResponses,
    questions,
    buttonTypes
  }));

  // Render sub-questions
  const renderSubQuestions = (question, track) => (
    <div className="space-y-3">
      {question[track].subQuestions && question[track].subQuestions.map((subQ, idx) => (
        <div key={subQ.id} className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Question {idx + 1}</div>
            <button
              onClick={() => removeSubQuestion(question.id, track, subQ.id)}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Remove
            </button>
          </div>
          <input
            type="text"
            value={subQ.label}
            onChange={(e) => updateSubQuestion(question.id, track, subQ.id, 'label', e.target.value)}
            placeholder={`Enter specific question (e.g., '${track === 'patient' ? 'How many days is your cycle?' : 'Previous fertility treatments?'}')`}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs mb-2"
          />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select
              value={subQ.inputType}
              onChange={(e) => updateSubQuestion(question.id, track, subQ.id, 'inputType', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
              <option value="radio">Radio</option>
            </select>
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={subQ.required}
                onChange={(e) => updateSubQuestion(question.id, track, subQ.id, 'required', e.target.checked)}
                className="mr-1"
              />
              Required
            </label>
          </div>
          
          {(['select', 'checkbox', 'radio'].includes(subQ.inputType)) && (
            <div className="mt-2 p-2 bg-white rounded border">
              <div className="text-xs font-medium mb-1">{track === 'patient' ? 'Answer Options:' : 'Clinical Options:'}</div>
              <div className="space-y-1">
                {(subQ.inputOptions || []).map((option, optIdx) => (
                  <div key={optIdx} className="grid grid-cols-4 gap-1 items-center">
                    <input 
                      type="text"
                      value={option.label || ''}
                      onChange={(e) => {
                        const newOptions = [...(subQ.inputOptions || [])];
                        newOptions[optIdx] = { ...option, label: e.target.value };
                        updateSubQuestion(question.id, track, subQ.id, 'inputOptions', newOptions);
                      }}
                      placeholder={track === 'patient' ? 'Label' : 'Clinical label'}
                      className="px-1 py-1 border border-gray-300 rounded text-xs"
                    />
                    <input 
                      type="text"
                      value={option.value || ''}
                      onChange={(e) => {
                        const newOptions = [...(subQ.inputOptions || [])];
                        newOptions[optIdx] = { ...option, value: e.target.value };
                        updateSubQuestion(question.id, track, subQ.id, 'inputOptions', newOptions);
                      }}
                      placeholder="Value"
                      className="px-1 py-1 border border-gray-300 rounded text-xs"
                    />
                    <select 
                      value={option.riskLevel || 'green'}
                      onChange={(e) => {
                        const newOptions = [...(subQ.inputOptions || [])];
                        newOptions[optIdx] = { ...option, riskLevel: e.target.value };
                        updateSubQuestion(question.id, track, subQ.id, 'inputOptions', newOptions);
                      }}
                      className="px-1 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="green">Green</option>
                      <option value="yellow">Yellow</option>
                      <option value="red">Red</option>
                    </select>
                    <button 
                      onClick={() => {
                        const newOptions = (subQ.inputOptions || []).filter((_, i) => i !== optIdx);
                        updateSubQuestion(question.id, track, subQ.id, 'inputOptions', newOptions);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newOptions = [...(subQ.inputOptions || []), { label: '', value: '', riskLevel: 'green' }];
                    updateSubQuestion(question.id, track, subQ.id, 'inputOptions', newOptions);
                  }}
                  className={`${track === 'patient' ? 'bg-green-400 hover:bg-green-600' : 'bg-green-400 hover:bg-green-600'} text-white px-2 py-1 rounded text-xs`}
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      <button
        onClick={() => addSubQuestion(question.id, track)}
        className={`w-full ${track === 'patient' ? 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300' : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'} py-2 px-3 rounded text-sm font-medium border`}
      >
        + Add Question
      </button>
    </div>
  );

  // Question type sidebar
  const renderQuestionTypeSidebar = () => (
    <div className={styles.sidebar}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Question Types</h2>
      
      <div className="space-y-3">
        {buttonTypes.map((buttonType) => (
          <div key={buttonType.id} className="group">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => addQuestion(buttonType.id)}
                className="flex-1 text-white p-3 rounded-lg font-medium text-left transition-all transform hover:scale-105 hover:-translate-y-0.5 bg-gradient-to-r from-green-500 to-green-600"
              >
                {buttonType.patientTitle}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1 px-2">
              Dr: {buttonType.physicianTitle}
            </div>
          </div>
        ))}
        
        <div className="border-t border-gray-300 pt-3 mt-4">
          <button
            onClick={() => setShowNewQuestionInput(true)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-3 rounded text-sm font-medium"
          >
            + Add Question Type
          </button>
        </div>

        {showNewQuestionInput && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <input
              type="text"
              value={newQuestionType}
              onChange={(e) => setNewQuestionType(e.target.value)}
              placeholder="Enter question type title"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newQuestionType.trim()) {
                  const newId = 'custom_' + Date.now();
                  setButtonTypes(prev => [...prev, {
                    id: newId,
                    patientTitle: newQuestionType.trim(),
                    physicianTitle: newQuestionType.trim() + ' Assessment',
                    type: 'text',
                    patientContext: 'Enter patient educational context.',
                    physicianContext: 'Enter clinical context.',
                    defaultLabTests: []
                  }]);
                  setNewQuestionType('');
                  setShowNewQuestionInput(false);
                }
              }}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if (newQuestionType.trim()) {
                    const newId = 'custom_' + Date.now();
                    setButtonTypes(prev => [...prev, {
                      id: newId,
                      patientTitle: newQuestionType.trim(),
                      physicianTitle: newQuestionType.trim() + ' Assessment',
                      type: 'text',
                      patientContext: 'Enter patient educational context.',
                      physicianContext: 'Enter clinical context.',
                      defaultLabTests: []
                    }]);
                    setNewQuestionType('');
                    setShowNewQuestionInput(false);
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
              >
                Add
              </button>
              <button 
                onClick={() => {
                  setNewQuestionType('');
                  setShowNewQuestionInput(false);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Questions list
  const renderQuestionsList = () => (
    <div className="col-span-4 p-6">
      {questions.length === 0 ? (
        <div className="border-3 border-dashed border-green-400 rounded-xl p-20 text-center text-green-600 bg-green-50">
          <div className="text-2xl font-semibold mb-4">Add Questions Here</div>
          <div className="text-lg opacity-70 mb-4">Click buttons from the sidebar to add questions to your form</div>
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((question) => (
            <div 
              key={question.id} 
              className={styles.questionCard}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-9 h-9 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                    {question.id}
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold uppercase">
                    {buttonTypes.find(bt => bt.id === question.type)?.patientTitle || question.type}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuestionToDelete(question.id);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Delete Question
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Track */}
                <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Patient Track</h3>

                  <div className="mb-4 p-3 rounded-lg border border-green-300 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                      <div className="font-semibold text-gray-800">Question Set Title</div>
                    </div>
                    <input 
                      type="text"
                      value={question.patient.title}
                      onChange={(e) => updateQuestion(question.id, 'patient', 'title', e.target.value)}
                      placeholder="Question set title"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div className="mb-4 p-3 rounded-lg border border-green-300 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                      <div className="font-semibold text-gray-800">Educational Context</div>
                    </div>
                    <textarea 
                      value={question.patient.context}
                      onChange={(e) => updateQuestion(question.id, 'patient', 'context', e.target.value)}
                      placeholder="Why this matters in patient-friendly language"
                      className="w-full px-3 py-2 border border-gray-300 rounded h-16 resize-y text-sm"
                    />
                  </div>

                  <div className="mb-4 p-3 rounded-lg border border-green-300 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                      <div className="font-semibold text-gray-800">Questions</div>
                    </div>
                    {renderSubQuestions(question, 'patient')}
                  </div>

                  <div className="p-3 rounded-lg border border-green-300 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
                        <div className="font-semibold text-gray-800">Algorithm</div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAlgorithmBuilder && onOpenAlgorithmBuilder(question.id, 'patient');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold"
                      >
                        Configure Rules
                      </button>
                    </div>
                    {question.patient.algorithmRules && question.patient.algorithmRules.length > 0 && (
                      <div className="text-xs text-green-700 font-medium">
                        {question.patient.algorithmRules.length} rule(s) configured ✅
                      </div>
                    )}
                  </div>
                </div>

                {/* Physician Track */}
                <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-purple-800">Physician Track</h3>
                    <div className="flex items-center gap-2">
                      {autoFillNotification === question.id && (
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium animate-pulse">
                          ✅ Auto-filled with clinical enhancements
                        </div>
                      )}
                      <button
                        onClick={() => autoFillPhysicianTrack(question.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        title="Auto-fill from Patient Track with clinical enhancements"
                      >
                        📋 Auto-Fill from Patient
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 p-3 rounded-lg border border-green-300 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                      <div className="font-semibold text-gray-800">Question Set Title</div>
                    </div>
                    <input 
                      type="text"
                      value={question.physician.title}
                      onChange={(e) => updateQuestion(question.id, 'physician', 'title', e.target.value)}
                      placeholder="Clinical question set title"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div className="mb-4 p-3 rounded-lg border border-green-300 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                      <div className="font-semibold text-gray-800">Clinical Context</div>
                    </div>
                    <textarea 
                      value={question.physician.context}
                      onChange={(e) => updateQuestion(question.id, 'physician', 'context', e.target.value)}
                      placeholder="Clinical significance and interpretation"
                      className="w-full px-3 py-2 border border-gray-300 rounded h-16 resize-y text-sm"
                    />
                  </div>

                  <div className="mb-4 p-3 rounded-lg border border-green-300 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                      <div className="font-semibold text-gray-800">Clinical Questions</div>
                    </div>
                    {renderSubQuestions(question, 'physician')}
                  </div>

                  <div className="mb-4 p-3 rounded-lg border border-green-300 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
                      <div className="font-semibold text-gray-800">Laboratory Tests</div>
                    </div>
                    <div className="space-y-2">
                      {question.physician.labTests && question.physician.labTests.map((test, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                          <span className="text-sm">{test}</span>
                          <button 
                            onClick={() => {
                              const updatedTests = question.physician.labTests.filter((_, i) => i !== idx);
                              updateQuestion(question.id, 'physician', 'labTests', updatedTests);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newLabTest}
                          onChange={(e) => setNewLabTest(e.target.value)}
                          placeholder="Enter lab test name"
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newLabTest.trim()) {
                              const updatedTests = [...(question.physician.labTests || []), newLabTest.trim()];
                              updateQuestion(question.id, 'physician', 'labTests', updatedTests);
                              setNewLabTest('');
                            }
                          }}
                        />
                        <button 
                          onClick={() => {
                            if (newLabTest.trim()) {
                              const updatedTests = [...(question.physician.labTests || []), newLabTest.trim()];
                              updateQuestion(question.id, 'physician', 'labTests', updatedTests);
                              setNewLabTest('');
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-green-300 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">5</div>
                        <div className="font-semibold text-gray-800">Algorithm</div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAlgorithmBuilder && onOpenAlgorithmBuilder(question.id, 'physician');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold"
                      >
                        Configure Rules
                      </button>
                    </div>
                    {question.physician.algorithmRules && question.physician.algorithmRules.length > 0 && (
                      <div className="text-xs text-green-700 font-medium">
                        {question.physician.algorithmRules.length} rule(s) configured ✅
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="grid grid-cols-5 gap-0 min-h-screen">
        {renderQuestionTypeSidebar()}
        {renderQuestionsList()}
      </div>

      {/* Delete Question Confirmation Dialog */}
      {questionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-3">Confirm Deletion</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteQuestion(questionToDelete)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
              >
                Delete
              </button>
              <button
                onClick={() => setQuestionToDelete(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// =============================================================================
// MAIN INDEPENDENT FORMBUILDER MODULE
// =============================================================================
const FormBuilderModule = ({ 
  // Integration interfaces
  apiClient = null,
  userPermissions = [],
  onTemplateCreate = () => {},
  onTemplateUpdate = () => {},
  onTemplateDelete = () => {},
  onFormSubmit = () => {},
  
  // Configuration options
  initialButtonTypes = [],
  initialQuestions = [],
  
  // Styling options
  styling = {},
  
  // Feature toggles
  features = {
    algorithmBuilder: true,
    patientResponseProcessing: true,
    labTestIntegration: true,
    autoFillPhysician: true
  },
  
  // Event callbacks
  onQuestionCreate = () => {},
  onQuestionUpdate = () => {},
  onQuestionDelete = () => {},
  onAlgorithmUpdate = () => {},
  
  // Display options
  showHeader = true,
  title = "FormBuilder Module",
  subtitle = "Independent & Reusable Form Builder"
}) => {
  const issueManagerRef = useRef();
  const [showAlgorithmBuilder, setShowAlgorithmBuilder] = useState(false);
  const [currentAlgorithmIssue, setCurrentAlgorithmIssue] = useState(null);
  const [currentAlgorithmTrack, setCurrentAlgorithmTrack] = useState(null);
  const [issues, setIssues] = useState(initialQuestions);

  // Patient response processing state
  const [patientResponses, setPatientResponses] = useState({});
  const [processingResults, setProcessingResults] = useState(null);

  const handleIssuesChange = useCallback((updatedIssues) => {
    setIssues(updatedIssues);
    onQuestionUpdate(updatedIssues);
    
    if (currentAlgorithmIssue) {
      const updatedAlgorithmIssue = updatedIssues.find(issue => issue.id === currentAlgorithmIssue.id);
      if (updatedAlgorithmIssue) {
        setCurrentAlgorithmIssue(updatedAlgorithmIssue);
      }
    }
  }, [onQuestionUpdate, currentAlgorithmIssue]);

  const handleOpenAlgorithmBuilder = useCallback((questionId, track) => {
    if (!features.algorithmBuilder) return;
    
    const issue = issues.find(i => i.id === questionId) || 
                  (issueManagerRef.current?.getQuestionById ? 
                   issueManagerRef.current.getQuestionById(questionId) : null);
    
    if (issue) {
      setCurrentAlgorithmIssue(issue);
      setCurrentAlgorithmTrack(track);
      setShowAlgorithmBuilder(true);
    }
  }, [features.algorithmBuilder, issues]);

  const handleSaveAlgorithm = useCallback((algorithmRules) => {
    if (currentAlgorithmIssue && currentAlgorithmTrack && issueManagerRef.current) {
      issueManagerRef.current.updateQuestionAlgorithm(
        currentAlgorithmIssue.id,
        currentAlgorithmTrack,
        algorithmRules
      );
      onAlgorithmUpdate(currentAlgorithmIssue.id, currentAlgorithmTrack, algorithmRules);
    }
  }, [currentAlgorithmIssue, currentAlgorithmTrack, onAlgorithmUpdate]);

  const handleCloseAlgorithmBuilder = useCallback(() => {
    setShowAlgorithmBuilder(false);
    setCurrentAlgorithmIssue(null);
    setCurrentAlgorithmTrack(null);
  }, []);

  // Test patient response processing
  const testPatientResponseProcessing = useCallback(() => {
    if (!features.patientResponseProcessing || !issueManagerRef.current?.processFormResponses) return;
    
    // Generate sample patient responses for testing
    const sampleResponses = {};
    issues.forEach(issue => {
      const issueResponses = {};
      issue.patient.subQuestions?.forEach(subQ => {
        if (subQ.inputType === 'number') {
          issueResponses[subQ.id] = Math.floor(Math.random() * 40) + 25;
        } else if (subQ.inputType === 'select') {
          const options = subQ.inputOptions || [];
          if (options.length > 0) {
            issueResponses[subQ.id] = options[Math.floor(Math.random() * options.length)].value;
          }
        }
      });
      sampleResponses[issue.id] = issueResponses;
    });
    
    setPatientResponses(sampleResponses);
    const results = issueManagerRef.current.processFormResponses(sampleResponses);
    setProcessingResults(results);
    onFormSubmit(sampleResponses, results);
  }, [features.patientResponseProcessing, issues, onFormSubmit]);

  // Export API for parent components
  const getFormConfiguration = useCallback(() => {
    return issueManagerRef.current?.getFormConfiguration() || { buttonTypes: [], questions: [], questionCounter: 0 };
  }, []);

  const processFormResponses = useCallback((responses) => {
    if (!features.patientResponseProcessing || !issueManagerRef.current?.processFormResponses) {
      return null;
    }
    return issueManagerRef.current.processFormResponses(responses);
  }, [features.patientResponseProcessing]);

  const exportFormTemplate = useCallback(() => {
    const config = getFormConfiguration();
    const template = {
      id: Date.now(),
      name: title,
      created: new Date().toISOString(),
      version: '1.0',
      configuration: config,
      features: features
    };
    onTemplateCreate(template);
    return template;
  }, [getFormConfiguration, title, features, onTemplateCreate]);

  const loadFormTemplate = useCallback((template) => {
    if (template.configuration && issueManagerRef.current) {
      // Load template configuration into the form builder
      setIssues(template.configuration.questions || []);
      onTemplateUpdate(template);
    }
  }, [onTemplateUpdate]);

  // Module API for external integration
  const moduleAPI = {
    getFormConfiguration,
    processFormResponses,
    exportFormTemplate,
    loadFormTemplate,
    testPatientResponseProcessing,
    getCurrentQuestions: () => issues,
    getProcessingResults: () => processingResults
  };

  // Make API available to parent
  React.useEffect(() => {
    if (window && typeof window === 'object') {
      window.FormBuilderModuleAPI = moduleAPI;
    }
  }, [moduleAPI]);

  const defaultStyling = {
    container: "min-h-screen bg-gray-100",
    header: "bg-white border-b border-gray-200 px-6 py-4 shadow-sm",
    title: "text-2xl font-bold text-gray-800",
    subtitle: "text-gray-600 mt-1",
    processingResults: "bg-green-50 border-b border-green-200 px-6 py-4",
    ...styling
  };

  return (
    <div className={defaultStyling.container}>
      {/* Header */}
      {showHeader && (
        <div className={defaultStyling.header}>
          <h1 className={defaultStyling.title}>{title}</h1>
          <p className={defaultStyling.subtitle}>{subtitle}</p>
          <div className="flex gap-4 mt-3">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              ✅ Independent Module
            </span>
            {features.algorithmBuilder && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✅ Algorithm Engine
              </span>
            )}
            {features.patientResponseProcessing && (
              <span className="bg-green-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                ✅ Response Processing
              </span>
            )}
            {features.patientResponseProcessing && (
              <button
                onClick={testPatientResponseProcessing}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors"
              >
                Test Processing
              </button>
            )}
            <button
              onClick={exportFormTemplate}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors"
            >
              Export Template
            </button>
          </div>
        </div>
      )}

      {/* Processing Results Display */}
      {features.patientResponseProcessing && processingResults && (
        <div className={defaultStyling.processingResults}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-green-800">Patient Response Processing Results</h3>
            <button
              onClick={() => setProcessingResults(null)}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(processingResults).map(([issueId, result]) => {
              const issue = issues.find(i => i.id == issueId);
              return (
                <div key={issueId} className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="font-medium text-gray-800 mb-2">
                    Issue {issueId}: {issue?.patient?.title || 'Unknown'}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Patient:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.patient.level === 'RED' ? 'bg-red-100 text-red-800' :
                        result.patient.level === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {result.patient.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Physician:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.physician.level === 'RED' ? 'bg-red-100 text-red-800' :
                        result.physician.level === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {result.physician.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Overall:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.overallRisk === 'RED' ? 'bg-red-100 text-red-800' :
                        result.overallRisk === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {result.overallRisk}
                      </span>
                    </div>
                    {result.patient.diagnosticMessage && (
                      <div className="text-xs text-gray-600 mt-2">
                        <strong>Diagnosis:</strong> {result.patient.diagnosticMessage}
                      </div>
                    )}
                    {result.patient.treatmentRecommendation && (
                      <div className="text-xs text-gray-600">
                        <strong>Treatment:</strong> {result.patient.treatmentRecommendation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main FormBuilder Interface */}
      <div className="min-h-screen">
        <IssueManager 
          ref={issueManagerRef}
          onOpenAlgorithmBuilder={handleOpenAlgorithmBuilder}
          onIssuesChange={handleIssuesChange}
          initialButtonTypes={initialButtonTypes}
          styling={styling}
        />
      </div>

      {/* Algorithm Builder Modal */}
      {features.algorithmBuilder && (
        <AlgorithmBuilder
          issue={currentAlgorithmIssue}
          track={currentAlgorithmTrack}
          isOpen={showAlgorithmBuilder}
          onClose={handleCloseAlgorithmBuilder}
          onSaveAlgorithm={handleSaveAlgorithm}
          styling={styling}
        />
      )}

      {/* Module Status Indicator */}
      <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg max-w-xs">
        <div className="font-semibold">✅ FormBuilder Module Active</div>
        <div className="text-xs">✅ Independent & Reusable</div>
        <div className="text-xs">✅ Zero External Dependencies</div>
        <div className="text-xs">✅ Generic Integration Interfaces</div>
        <div className="text-xs">🚀 Ready for Integration</div>
      </div>
    </div>
  );
};

// =============================================================================
// USAGE EXAMPLES AND INTEGRATION GUIDE
// =============================================================================

// Example 1: Basic Integration
const BasicUsageExample = () => {
  const handleTemplateCreate = (template) => {
    console.log('New template created:', template);
    // Save to your backend/database
  };

  const handleFormSubmit = (responses, results) => {
    console.log('Form submitted:', responses, results);
    // Process results in your application
  };

  return (
    <FormBuilderModule
      title="My Custom Form Builder"
      subtitle="Powered by Independent FormBuilder Module"
      onTemplateCreate={handleTemplateCreate}
      onFormSubmit={handleFormSubmit}
    />
  );
};

// Example 2: Advanced Integration with Custom Styling
const AdvancedUsageExample = () => {
  const customStyling = {
    container: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100",
    header: "bg-white border-b border-indigo-200 px-6 py-4 shadow-lg",
    title: "text-3xl font-bold text-indigo-800",
    button: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
  };

  const customButtonTypes = [
    {
      id: 'custom_symptom',
      patientTitle: 'What symptoms are you experiencing?',
      physicianTitle: 'Symptom Assessment',
      type: 'checkbox',
      patientContext: 'Help us understand your current symptoms.',
      physicianContext: 'Clinical symptom evaluation for diagnostic purposes.',
      defaultLabTests: ['CBC', 'CMP']
    }
  ];

  return (
    <FormBuilderModule
      title="Advanced Medical Form Builder"
      subtitle="Custom Integration Example"
      initialButtonTypes={customButtonTypes}
      styling={customStyling}
      features={{
        algorithmBuilder: true,
        patientResponseProcessing: true,
        labTestIntegration: true,
        autoFillPhysician: true
      }}
      onTemplateCreate={(template) => {
        // Save to medical records system
        console.log('Medical template created:', template);
      }}
      onFormSubmit={(responses, results) => {
        // Process in EMR system
        console.log('Medical form submitted:', responses, results);
      }}
    />
  );
};

// Example 3: API Integration
const APIIntegratedExample = () => {
  const apiClient = {
    save: async (data) => {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    load: async (id) => {
      const response = await fetch(`/api/forms/${id}`);
      return response.json();
    }
  };

  return (
    <FormBuilderModule
      apiClient={apiClient}
      userPermissions={['create_forms', 'edit_algorithms']}
      onTemplateCreate={async (template) => {
        await apiClient.save(template);
      }}
      onTemplateUpdate={async (template) => {
        await apiClient.save(template);
      }}
    />
  );
};

// Example 4: Minimal Integration (Demo Mode)
const MinimalDemo = () => {
  return (
    <FormBuilderModule
      title="FormBuilder Demo"
      subtitle="Minimal Configuration"
      showHeader={true}
      features={{
        algorithmBuilder: true,
        patientResponseProcessing: false,
        labTestIntegration: false,
        autoFillPhysician: false
      }}
    />
  );
};

// Default export - the main FormBuilder module
export default FormBuilderModule;

// Named exports for specific use cases
export {
  FormBuilderModule,
  BasicUsageExample,
  AdvancedUsageExample,
  APIIntegratedExample,
  MinimalDemo,
  
  // Export core components for advanced customization
  IssueManager,
  AlgorithmBuilder,
  
  // Export core algorithms for external use
  processAlgorithmRules,
  processPatientFormSubmission,
  evaluateCondition
};
