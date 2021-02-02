module.exports = function(sequelize , DataTypes){
    var quiz = sequelize.define('quiz' , {
        title : {
            type : DataTypes.STRING,
            allowNull : false
        },
        description : {
            type : DataTypes.STRING,
            allowNull : false
        },
        level : {
            type : DataTypes.ENUM,
            values : [
                'easy',
                'medium',
                'difficult'
            ],
            defaultValue : 'easy'
        },
        is_active : {
            type : DataTypes.BOOLEAN,
            defaultValue : true
        }
    });
    return quiz;
};