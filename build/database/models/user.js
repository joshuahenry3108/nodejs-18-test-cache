'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUser = initUser;
const sequelize_1 = require("sequelize");
class User extends sequelize_1.Model {
}
function initUser(sequelize) {
    User.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true
        },
    }, {
        sequelize,
        tableName: 'user',
        modelName: 'User'
    });
    return User;
}
exports.default = User;
