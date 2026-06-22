/**
 * Suggestus Session Model
 * @author Speedum Team
 * @copyright Copyright (c) 2022 Speedum
 */

let mSgPatientId = '';
let mSgVisitId = '';

const SessionModel = {
  setSgPatientId(sgPatientId) {
    mSgPatientId = sgPatientId;
  },
  
  setSgVisitId(sgVisitId) {
    mSgVisitId = sgVisitId;
  },

  getMetaData() {
    return {
      sgPatientId: mSgPatientId,
      sgVisitId: mSgVisitId
    };
  }
};

export default SessionModel;
