module.exports = (sequelize, DataTypes) => {
    var hr_admin = sequelize.define('hr_admin', {
        first_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        position: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });
    return hr_admin;
};