module.exports = function(sequelize , DataTypes){
    var quiz_item = sequelize.define('quiz_item' , {
        question : {
            type : DataTypes.STRING,
            allowNull : false
        },
        options_one : {
            type : DataTypes.STRING,
            allowNull : false
        },
        options_two : {
            type : DataTypes.STRING,
            allowNull : false
        },
        options_three : {
            type : DataTypes.STRING,
            allowNull : false
        },
        answer : {
            type : DataTypes.ENUM,
            values : [
                'options_one',
                'options_two',
                'options_three'
            ]
        }
    });

    return quiz_item;
};