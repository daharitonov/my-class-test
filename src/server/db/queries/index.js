const knex = require('../connection');
const {isAfter, addYears, addDays, getDay} = require('date-fns');

function getLessons(data) {
    const lessons = knex('lessons')
    if (Array.isArray(data.teacherIds))
    lessons.innerJoin('lesson_teachers', 'lesson_teachers.lesson_id', 'lessons.id' )
    else lessons.leftJoin('lesson_teachers', 'lesson_teachers.lesson_id', 'lessons.id' )
    .leftJoin('lesson_students', 'lesson_students.lesson_id', 'lessons.id')
    .leftJoin('students', 'students.id', 'lesson_students.student_id')
        .groupBy(['lessons.id'])
        .select(
          knex.raw(
            `lessons.*`,
          ),
        )
    if (Array.isArray(data.teacherIds))
        lessons.whereIn('lesson_teachers.teacher_id', data.teacherIds)
    if (typeof data.status === 'number') {
        lessons.where('status', data.status);
    }
    if (Array.isArray(data.studentsCount))
        if (data.studentsCount.length == 1)
            lessons.havingRaw('count(distinct students) = ?', [data.studentsCount[0]]);
        else {
            lessons.havingRaw('count(distinct students) >= ?', [data.studentsCount[0]]);
            lessons.havingRaw('count(distinct students) <= ?', [data.studentsCount[1]]);
        }
    if (Array.isArray(data.date))
        if (data.date.length == 1)
            lessons.where('lessons.date',  '=', [data.date[0]]);
        else {
            lessons.where('lessons.date',  '>=', [data.date[0]]);
            lessons.where('lessons.date', '<=', [data.date[1]]);
        }
    lessons.offset((data.page  -1) * data.lessonsPerPage);
    lessons.limit(data.lessonsPerPage);
    lessons.as('t1');

    const lessonsAdditional = knex('lessons as t2')
        .select(
            knex.raw(
                't2.*, json_agg(DISTINCT teachers) as teachers, json_agg(DISTINCT lesson_students) as "lessonStudents",  json_agg(DISTINCT students) as students'
            ),
        )
        .innerJoin(lessons, 't1.id', 't2.id')
        .leftJoin('lesson_teachers', 'lesson_teachers.lesson_id', 't2.id')
        .leftJoin('teachers', 'teachers.id', 'lesson_teachers.teacher_id')
        .leftJoin('lesson_students', 'lesson_students.lesson_id', 't2.id')
        .leftJoin('students', 'students.id', 'lesson_students.student_id')
        .groupBy('t2.id')
        
    return lessonsAdditional;
}

async function createLessons(data) {
    const maxCnt = data.lessonsCount || 300;
    const lastDate = data.lastDate || addYears(data.firstDate, 1);
    const insertData = [...Array(366).keys()]
        .map( d => addDays(data.firstDate, d) )
        .filter( d => data.days.includes(getDay(d)) && isAfter(lastDate, d) )
        .slice(0, maxCnt)
        .map( day => {
            return {
                date: day,
                title: data.title,
            }
        })
    if (insertData.length) {
        const trxProvider = knex.transactionProvider();
        const trx = await trxProvider();
        const ids = await trx('lessons').insert(insertData, 'id');
        const insertDataLessonTeachers = ids.map( lessonId => data.teacherIds.map( teacherId =>  { return {lesson_id: lessonId, teacher_id: teacherId} }) ).flat();
        await trx('lesson_teachers').insert(insertDataLessonTeachers);
        await trx.commit();
        return ids;
    } else 
        return [];
        
}

module.exports = {
    getLessons,
    createLessons,
}