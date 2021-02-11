let quiz_stages = require('../constants.js').QUIZ_STAGES;

module.exports = function(sequelize , DataTypes){
    var quiz_result = sequelize.define('quiz_test' ,  {
        score : {
            type : DataTypes.DOUBLE,
            defaultValue : 0
        },
        stage : {
            type : DataTypes.ENUM(quiz_stages),
            values : quiz_stages,
            defaultValue : quiz_stages[0],
            set(value){
                if (!quiz_stages.includes(value)) {
                    throw new EnumValidationError('incorrect stage' , 'stage' , quiz_stages , value);
                }
                this.setDataValue('stage', value);
            }
        }
    });
    return quiz_result;
};