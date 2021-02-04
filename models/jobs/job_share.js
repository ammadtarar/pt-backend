module.exports = function(sequelize , DataTypes){
    var job_share = sequelize.define('job_share' , {
        view_count : {
            type : DataTypes.INTEGER,
            defaultValue : 0
        }
    });

    job_share.prototype.updateViewCount = function() {
        console.log();
        console.log("=== updateViewCount");
        console.log();
        job_share.update({
            view_count: (this.getDataValue('view_count') || 0) + 1
        }, {
          where: {
            id: this.getDataValue('id')
          }
        })
    };

    return job_share;
};