const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const CONSTANTS = require('../../../models/constants.js');
const middleware = require('../../../controllers/middleware.js')(db);

app.post('/create' , middleware.authenticateSuperAdmin , (req , res , next)=>{

    let body = req.body;
    if (body === null || body === undefined || Object.keys(body).length === 0) {
        res.status(422).send({
            message: res.__('body_data_missing')
        });
        return;
    }

    var quiz = underscore.pick(body , 'title' , 'description' , 'level' , 'is_active');
    if(quiz === null || quiz === undefined  || Object.keys(quiz).length < 3 ){
        res.status(422).send({
            message: res.__('quiz_missing_data')
        });
        return;
    }

    db.quiz.create(quiz)
    .then((response)=>{
        res.json({
            message : res.__('quiz_created_successfully'),
            quiz : response
        })
    })
    .catch((err)=>{
        next(err);
    });

});

app.post('/:id' , middleware.authenticate , (req , res , next)=>{

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('quiz_id_missing')
        });
        return;
    }

    let body = req.body;
    if (body === null || body === undefined || Object.keys(body).length === 0) {
        res.status(422).send({
            message: res.__('body_data_missing')
        });
        return;
    }

    var quiz = underscore.pick(body , 'title' , 'description' , 'level' , 'is_active');
    if(quiz === null || quiz === undefined  || Object.keys(quiz).length < 3 ){
        res.status(422).send({
            message: res.__('quiz_missing_data')
        });
        return;
    }

    db.quiz.update(quiz , {
        where : {
            id :id 
        }
    })
    .then((response)=>{
        if(response){
            res.json({
                message : res.__('quiz_update_successful')
            });
        }else{
            res.status(422).json({
                message : res.__('quiz_update_failed')
            });
        }
    })
    .catch((err)=>{
        next(err);
    })

});

app.post('/:id/add/questions' , middleware.authenticateSuperAdmin , (req , res , next)=>{

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('quiz_id_missing')
        });
        return;
    }
    
    let body = req.body;
    if (body === null || body === undefined || Object.keys(body).length != 1) {
        res.status(422).send({
            message: res.__('quiz_question_missing')
        });
        return;
    }

    var questions = body.questions;
    if(questions === null || questions === undefined || !Array.isArray(questions) || questions.length <= 0){
        res.status(422).send({
            message: res.__('quiz_question_missing')
        });
        return;
    }

    var incorrect_data = false;
    var parsedQuestions = [];

    questions.forEach((question)=>{
        var q = underscore.pick(question , 'question' , 'option_one' , 'option_two' , 'option_three' , 'answer');
        if(q === null || q === undefined || Object.keys(q).length != 5){
            incorrect_data = true;
            return;
        }
        q.quizId = id;
        parsedQuestions.push(q);
    });

    if(incorrect_data){
        res.status(422).send({
            message: res.__('quiz_question_missing')
        });
        return;
    }

    db.quiz_item.bulkCreate(parsedQuestions)
    .then((response)=>{
        res.json({
            message : res.__('questions_added')
        });
    })
    .catch((err)=>{
        next(err);
    });

});


app.patch('/question/:id' , middleware.authenticateSuperAdmin , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('quiz_id_missing')
        });
        return;
    }

    var body = underscore.pick(req.body , 'question' , 'option_one' , 'option_two' , 'option_three' , 'answer');
    db.quiz_item.update(body , {
        where : {
            id : id
        }
    })
    .then(response => {
        res.json({
            message : res.__('question_updated')
        });
    })
    .catch(err =>{
        next(err);
    })
})


app.delete('/question/:id' , middleware.authenticateSuperAdmin , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('quiz_id_missing')
        });
        return;
    }

    db.quiz_item.destroy({
        where : {
            id : id
        }
    })
    .then(response => {
        res.json({
            message : res.__('question_deleted')
        });
    })
    .catch(err =>{
        next(err);
    })
})

app.get('/:id' , middleware.authenticate , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('quiz_id_missing')
        });
        return;
    }

    db.quiz.findOne({
        where : {
            id : id
        },
        include : [
            {
                model : db.quiz_item,
                as : 'questions',
                attributes : {
                    exclude : ['quizId']
                }
            }
        ]
    })
    .then((quiz)=>{
        res.json(quiz);
    })
    .catch((err)=>{
        next(err);
    });
});

app.get('/list/all' , middleware.authenticate , (req , res , next)=>{

    var limit = parseInt(req.query.limit) || 10;
    var page = parseInt(req.query.page) || 0;
    if (page >= 1) {
        page = page - 1;
    }

    var where = {};

    let title = req.query.title;
    if(title !== null && title !== undefined){
        where.title = {
            [db.Op.like]: '%' + title + '%'
        }
    }

    let description = req.query.description;
    if(description !== null && description !== undefined){
        where.description = {
            [db.Op.like]: '%' + description + '%'
        }
    }

    let level = req.query.level;
    if(level !== null && level !== undefined){
        where.level = {
            [db.Op.like]: '%' + level + '%'
        }
    }

    if(req.query.hasOwnProperty("is_active")){
        where.is_active = req.query.is_active === 'true';
    }

    db.quiz.findAndCountAll({
        where : where,
        limit: limit,
        offset: limit * page,
        order: [
            ['createdAt', 'DESC']
        ],
        include: [{
            model : db.quiz_item,
            as : 'questions',
            attributes : {
                exclude : ['quizId']
            }
        }],
        distinct:true
    })
    .then((quizzes) => {
        res.json(quizzes);
    })
    .catch((err) => {
        next(err);
    });
});

app.post('/:id/take/test' , middleware.authenticateCompanyUser , (req , res , next)=>{

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('quiz_id_missing')
        });
        return;
    }

    if(req.user.user_type === CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).send({
            message: res.__('only_user_can_take_test')
        });
        return;
    }

    db.quiz_test.findOne({
        where : {
            quizId : id,
            employeeId : req.user.id,
            stage : 'in_progress'
        }
    })
    .then(async (existingQuiz)=>{
        let questions = await getQuizQuestionsInRandomOrder(id);

        if(existingQuiz){
            res.status(201).json({
                message : res.__('quiz_already_started'),
                quiz_test_id : existingQuiz.id,
                questions : questions
            });
        }else{
            db.quiz_test.create({
                quizId : id,
                employeeId : req.user.id
            })
            .then((quizTest)=>{
                res.json({
                    message : res.__('quiz_test_stared'),
                    quiz_test : quizTest,
                    questions : questions
                });
            });
        }
    })
    .catch((err)=>{
        next(err);
    });

});

app.post('/test/:id/update/score' , middleware.authenticateCompanyUser , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('quiz_test_id_missing')
        });
        return;
    }

    if(req.user.user_type === CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).send({
            message: res.__('only_quiz_can_add_score')
        });
        return;
    }
    
    var body = underscore.pick(req.body , 'score');
    if(body === null || body === undefined  || Object.keys(body).length != 1 ){
        res.status(422).send({
            message: res.__('quiz_score_missing')
        });
        return;
    }
    
    var score  = parseFloat(body.score);
    // console.log("score = " , score);
    // console.log("score = " , !score);
    // if(!score){
    //     res.status(402).json({
    //         message : res.__('invalid_score' , {score : body.score})
    //     });
    //     return
    // }
   
    db.quiz_test.findOne({
        where : {
            id : id,
            employeeId : req.user.id
        }
    })
    .then((existingTest)=>{
        if(!existingTest){
            res.status(404).json({
                message : res.__('quiz_test_not_found')
            });
        }
        // else if(existingTest.stage === CONSTANTS.CONSTANTS.COMPLETED){
        //     res.status(404).json({
        //         message : res.__('quiz_alread_completed')
        //     });
        // }
        else{
            db.quiz_test.update({
                stage : CONSTANTS.CONSTANTS.COMPLETED,
                score : body.score
            } , {
                where : {
                    id : id
                }
            })
            .then((updateResponse)=>{
                if(updateResponse){
                    res.json({
                        message : res.__('quiz_update_successful')
                    });
                }else{
                    res.status(422).json({
                        message : res.__('quiz_update_failed')
                    });
                }
                
            });
        }
    })
    .catch((err)=>{
        next(err);
    });

});

app.get('/my/tests/list/all' , middleware.authenticateCompanyUser , (req , res , next)=>{
    if(req.user.user_type === CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).send({
            message: res.__('only_employee_allowed')
        });
        return;
    }

    var limit = parseInt(req.query.limit) || 10;
    var page = parseInt(req.query.page) || 0;
    if (page >= 1) {
        page = page - 1;
    }

    var where = {
        employeeId : req.user.id
    };
    let stage = req.query.stage;
    if(stage !== null && stage !== undefined){
        where.stage = stage
    }

    db.quiz_test.findAndCountAll({
        limit: limit,
        offset: limit * page,
        order: [
            ['createdAt', 'DESC']
        ],
        where : where,
        attributes : {
            exclude : ['quizId','employeeId']
        },
        include : [
            {
                model : db.quiz,
                as : 'quiz'
            }
        ]
    })
    .then((tests)=>{
        res.json(tests);
    })
    .catch((err)=>{
        next(err);
    })
});


getQuizQuestionsInRandomOrder = async (quizId) =>{
    return new Promise((resolve , reject)=>{
        db.quiz.findOne({
            where : {
                id : quizId
            },
            include : [
                {
                    model : db.quiz_item,
                    as : 'questions',
                    attributes : {
                        exclude : ['quizId']
                    }
                }
            ]
        })
        .then((quiz)=>{
            var questions = quiz.questions;
            questions.shuffle();
            resolve(questions);
        })
        .catch((err)=>{
            reject(err)
        });
    });
};



Array.prototype.shuffle = function() {
  var i = this.length, j, temp;
  if ( i == 0 ) return this;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     temp = this[i];
     this[i] = this[j];
     this[j] = temp;
  }
  return this;
}

module.exports = app;