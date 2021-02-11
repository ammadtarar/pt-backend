let quiz_answers = require('../constants.js').QUIZ_ANSWERS;

module.exports = function(sequelize , DataTypes){
    var quiz_item = sequelize.define('quiz_item' , {
        question : {
            type : DataTypes.STRING,
            allowNull : false
        },
        option_one : {
            type : DataTypes.STRING,
            allowNull : false
        },
        option_two : {
            type : DataTypes.STRING,
            allowNull : false
        },
        option_three : {
            type : DataTypes.STRING,
            allowNull : false
        },
        answer : {
            type : DataTypes.ENUM(quiz_answers),
            values : quiz_answers,
            defaultValue : quiz_answers[0],
            set(value){
                if (!quiz_answers.includes(value)) {
                    throw new EnumValidationError('incorrect answer' , 'answer' , quiz_answers , value);
                }
                this.setDataValue('answer', value);
            }
        }
    });

    return quiz_item;
};