let wallet_activity_types = require('../constants.js').WALLET_ACTIVITY_TYPE;
let reward_types = require('../constants.js').JOB_REFERRAL_SUCCESS_REWARD_TYPES;
let reward_source_types = require('../constants.js').REWARD_TRANSACTION_SOURCE_TYPES;

module.exports = function(sequelize, DataTypes){
    var wallet_transaction = sequelize.define('wallet_transaction' , {
        transaction_type : {
            type : DataTypes.ENUM(wallet_activity_types),
            values : wallet_activity_types,
            defaultValue : wallet_activity_types[0],
            set(value){
                if (!wallet_activity_types.includes(value)) {
                    throw new EnumValidationError('incorrect transaction_type' , 'transaction_type' , wallet_activity_types , value);
                }
                this.setDataValue('transaction_type', value);
            }
        },
        reward_type : {
            type : DataTypes.ENUM(reward_types),
            values : reward_types,
            defaultValue : reward_types[0],
            set(value){
                if (!reward_types.includes(value)) {
                    throw new EnumValidationError('incorrect reward_type' , 'reward_type' , reward_types , value);
                }
                this.setDataValue('transaction_type', value);
            }
        },
        reward_value : {
            type : DataTypes.DOUBLE,
            defaultValue : 0
        },
        transaction_source : {
            type : DataTypes.ENUM(reward_source_types),
            values : reward_source_types,
            defaultValue : reward_source_types[0],
            set(value){
                if (!reward_source_types.includes(value)) {
                    throw new EnumValidationError('incorrect transaction_source' , 'transaction_source' , reward_source_types , value);
                }
                this.setDataValue('transaction_source', value);
            }
        }
    });

    return wallet_transaction;
};