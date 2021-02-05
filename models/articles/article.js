module.exports = function(sequelize , DataTypes){
    var article = sequelize.define('article' , {
        title : {
            type : DataTypes.STRING,
            allowNull : false
        },
        internal_url : {
            type : DataTypes.STRING,
            allowNull : true,
            unique: true
            // validate : {
            //     isUrl : true
            // }
        },
        original_url : {
            type : DataTypes.STRING,
            allowNull : false,
            unique: true,
            validate : {
                isUrl : true
            }
        },
        thumb_url : {
            type : DataTypes.STRING,
            allowNull : false,
            validate : {
                isUrl : true
            }
        },
        is_active : {
            type : DataTypes.BOOLEAN,
            defaultValue : true
        },
        view_count : {
            type : DataTypes.INTEGER,
            defaultValue : 0
        }
    });

    article.prototype.updateViewCount = function() {
        article.update({
            view_count: (this.getDataValue('view_count') || 0) + 1
        }, {
          where: {
            id: this.getDataValue('id')
          }
        })
    };

    article.prototype.saveInternalUrl = async function() {
        return new Promise((resolve , reject)=>{
            let newUrl = process.env.BASE_URL + 'company/article/' + String(this.getDataValue('id'));
            article.update({
                internal_url : newUrl
            }, {
              where: {
                id: this.getDataValue('id')
              }
            })
            .then((result)=>{
                if(result){
                    resolve(newUrl);
                }else{
                    reject();
                }
            })
            .catch((err)=>{
                reject(err);
            })
            
        })
       
    };

    return article;
};