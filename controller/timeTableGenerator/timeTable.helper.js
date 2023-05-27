let mixSubjects = (subjects) => {
    let midsubject = subjects[Math.round(subjects.length / 2)];
    subjects[Math.round(subjects.length / 2)] = subjects[subjects.length - 1]
    subjects[subjects.length - 1] = midsubject;
    let randomSubjectIndex = Math.floor(Math.random() * subjects.length);
    let randomSubject = subjects[randomSubjectIndex];
    subjects[randomSubjectIndex] = subjects[0];
    subjects[0] = randomSubject;
    subjects.reverse();
    return subjects;
}

module.exports = {
    selectSubject: async (subjects, lastSubject, highestPeriod, sameSubjectCount) => {
        subjects = mixSubjects(subjects);
        subjects = mixSubjects(subjects);

        for (let i = 0; i < subjects.length; i++) {
            let element = subjects[i];
            let newHighestPeriod = element.totalSubPeriods - 1 > highestPeriod ? element.totalSubPeriods - 1 : highestPeriod - 1;

            if (!lastSubject && element.totalSubPeriods != 0 && element.totalSubPeriods >= highestPeriod) {
                return {
                    highestPeriod: newHighestPeriod,
                    subjectIndex: i,
                    sameSubjectCount: 0
                }
            }

            if (
                (!!lastSubject
                    && lastSubject._id == element._id
                    && element.totalSubPeriods != 0
                    && element.totalSubPeriods >= highestPeriod
                    && sameSubjectCount < 2)
            ) {
                return {
                    highestPeriod: newHighestPeriod,
                    subjectIndex: i,
                    sameSubjectCount: sameSubjectCount + 1
                }
            }

            if (
                (!!lastSubject
                    && lastSubject._id != element._id
                    && element.totalSubPeriods != 0
                    && sameSubjectCount >= 2)
            ) {
                return {
                    highestPeriod: newHighestPeriod,
                    subjectIndex: i,
                    sameSubjectCount: 0
                }
            }

            if (
                (!!lastSubject
                    && lastSubject._id != element._id
                    && element.totalSubPeriods != 0
                    && sameSubjectCount < 2)
            ) {
                return {
                    highestPeriod: newHighestPeriod,
                    subjectIndex: i,
                    sameSubjectCount: sameSubjectCount + 1
                }
            }
        }
    }
}