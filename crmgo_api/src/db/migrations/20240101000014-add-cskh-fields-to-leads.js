'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('leads', 'birthday',    { type: Sequelize.DATEONLY,      allowNull: true  });
    await queryInterface.addColumn('leads', 'nganh',       { type: Sequelize.STRING(100),   allowNull: true  });
    await queryInterface.addColumn('leads', 'loai_khach',  { type: Sequelize.STRING(50),    allowNull: true  });
    await queryInterface.addColumn('leads', 'uu_tien',     { type: Sequelize.STRING(20),    allowNull: true, defaultValue: 'trung_binh' });
    await queryInterface.addColumn('leads', 'ngan_sach',   { type: Sequelize.STRING(50),    allowNull: true  });
    await queryInterface.addColumn('leads', 'thoi_diem',   { type: Sequelize.STRING(50),    allowNull: true  });
    await queryInterface.addColumn('leads', 'chandung',    { type: Sequelize.JSON,          allowNull: true  });
    await queryInterface.addColumn('leads', 'product',     { type: Sequelize.STRING(100),   allowNull: true  });
    await queryInterface.addColumn('leads', 'trang_thai',  { type: Sequelize.STRING(50),    allowNull: true, defaultValue: 'moi' });
    await queryInterface.addColumn('leads', 'cskh_calls',  { type: Sequelize.JSON,          allowNull: true  });
    await queryInterface.addColumn('leads', 'attachments', { type: Sequelize.JSON,          allowNull: true  });
    await queryInterface.addColumn('leads', 'area',        { type: Sequelize.STRING(100),   allowNull: true  }).catch(() => {
      // area có thể đã tồn tại từ trước (sync alter:true) — bỏ qua lỗi duplicate column
    });
  },

  async down(queryInterface) {
    const cols = [
      'birthday','nganh','loai_khach','uu_tien','ngan_sach',
      'thoi_diem','chandung','product','trang_thai','cskh_calls','attachments',
    ];
    for (const col of cols) {
      await queryInterface.removeColumn('leads', col).catch(() => {});
    }
  },
};
