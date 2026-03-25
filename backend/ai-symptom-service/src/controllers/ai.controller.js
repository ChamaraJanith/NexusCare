const checkSymptoms = (req, res) => {
  const { symptomsText = '', age, gender } = req.body || {};
  const text = symptomsText.toLowerCase();

  let suggestedSpeciality = 'General Physician';
  let riskLevel = 'low';
  let advice = 'Please book a general consultation if symptoms persist.';

  if (text.includes('chest pain') || text.includes('shortness of breath')) {
    suggestedSpeciality = 'Cardiologist';
    riskLevel = 'high';
    advice = 'This may be serious. Please seek urgent medical attention.';
  } else if (text.includes('fever') && text.includes('cough')) {
    suggestedSpeciality = 'General Physician';
    riskLevel = 'medium';
    advice = 'You may have a viral infection. Monitor and book a consultation.';
  }

  return res.json({
    riskLevel,
    suggestedSpeciality,
    advice,
    meta: {
      age: age || null,
      gender: gender || null,
      disclaimer: 'This is not a medical diagnosis. Please consult a doctor.'
    }
  });
};

module.exports = { checkSymptoms };