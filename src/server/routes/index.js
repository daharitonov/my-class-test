const Router = require('koa-router');
const { z } = require('zod');
const router = new Router();
const queries = require('../db/queries/index');
const {isAfter, addYears, format} = require('date-fns');

router.get('/', async (ctx) => {
  const query = z.object({
    status: z.enum(['0', '1']).transform( val => parseInt(val) ).optional(),
    date:  z.preprocess(val => val.split(','), z.array(z.coerce.date())).optional(),
    teacherIds: z.preprocess(val => val.split(','), z.array(z.coerce.number())).optional(),
    studentsCount: z.preprocess(val => val.split(','), z.array(z.coerce.number())).optional(),
    page: z.coerce.number().min(1).optional().default(1),
    lessonsPerPage: z.coerce.number().min(1).max(100).optional().default(5),
  });
  const {date, status, teacherIds, studentsCount, page = 1, lessonsPerPage = 10} = ctx.request.query;
  const res = query.safeParse(ctx.request.query);

  if (res.success)
  {
    const lessons = await queries.getLessons(res.data);
    ctx.body = lessons;
  }
  else {
    ctx.status = 400;
    ctx.body = res.error.message;
  }
})

router.post('/lessons', async (ctx) => {
  const query = z.object({
    teacherIds: z.array(z.number()).min(1),
    title: z.string(),
    days: z.array(z.number().min(0).max(6)).min(1),
    firstDate: z.coerce.date(),
    lessonsCount: z.number().min(1).max(300).optional(),
    lastDate: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.lessonsCount && !data.lastDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastDate", "lessonsCount"],
        message: "lastDate should be set if lessonsCount isn't",
      });
    }
    if (data.lastDate && isAfter(data.lastDate, addYears(data.firstDate, 1))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastDate"],
        message: `lastDate should not be greater ${format(addYears(data.firstDate, 1), 'yyyy-MM-dd' )}`,
      });
    }
 })
  const res = query.safeParse(ctx.request.body);
  if (res.success)
  {
    const createResult = await queries.createLessons(res.data);
    ctx.body = createResult;
  }
  else {
    ctx.status = 400;
    ctx.body = res.error.message;
  }

});

module.exports = router;
