module.exports = function(sequelize , DataTypes){
    var quiz_result = sequelize.define('quiz_result' ,  {
        score : {
            type : DataTypes.DOUBLE,
            allowNull : false
        }
    });
    return quiz_result;
};