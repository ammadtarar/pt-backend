module.exports = (sequelize, DataTypes) => {
    var company = sequelize.define('company', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    });
    return company;
};