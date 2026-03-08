exports.calculateNextDose = function(master,dose,date){

  if(dose >= master.totalDose) return null;

  const next = new Date(date);

  next.setDate(next.getDate() + master.intervalDays);

  return next.toISOString().slice(0,10);

};

exports.detectDose = function(history){

  if(!history.length) return 1;

  const lastDose = Math.max(...history.map(x=>x.doseNumber));

  return lastDose + 1;

};