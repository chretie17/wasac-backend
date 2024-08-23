// models/Claim.js
module.exports = (sequelize, DataTypes) => {
  const Claim = sequelize.define('Claim', {
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
    },
  });

  Claim.associate = function(models) {
    Claim.belongsTo(models.User, {
      foreignKey: 'userEmail',
      targetKey: 'email',
      as: 'user'
    });
  };

  return Claim;
};
