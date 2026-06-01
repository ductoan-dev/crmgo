'use strict';

const bcrypt = require('bcrypt');

const HASH = '$2b$10$RydE12m3FWCjin3UPoSa9.2FMZFxzGQ2boIHSUnz.WeGvcE5cP1p6'; // 123456

module.exports = {
  async up(queryInterface) {
    // Pre-hash password "123456" — generate once to avoid slow seeding
    // bcrypt.hashSync('123456', 10) → use pre-computed hash above for speed

    const users = [
      { username: 'nhanvien1', name: 'Nguyễn Văn An',           role: 'sales',  is_leader: false },
      { username: 'nhanvien2', name: 'Trần Thị Bích',           role: 'sales',  is_leader: false },
      { username: 'nhanvien3', name: 'Lê Minh Tuấn',            role: 'sales',  is_leader: false },
      { username: 'mkt1',      name: 'Lê Thị Thu Hà',           role: 'mkt',    is_leader: false },
      { username: 'mkt2',      name: 'Nguyễn Minh Khôi',        role: 'mkt',    is_leader: false },
      { username: 'cskh1',     name: 'Trần Phương Anh',         role: 'cskh',   is_leader: false },
      { username: 'ketoan1',   name: 'Phạm Thị Ngân',           role: 'ketoan', is_leader: false },
      { username: 'design1',   name: 'Hoàng Thị Lan',           role: 'design', is_leader: false },
      { username: 'design2',   name: 'Trần Quang Minh',         role: 'design', is_leader: false },
      { username: 'kho1',      name: 'Nguyễn Thị Hoa',          role: 'kho',    is_leader: false },
      { username: 'quanly1',   name: 'Quản lý Hệ thống',        role: 'smgr',   is_leader: true  },
      { username: 'sanxuat1',  name: 'Công ty In Tân Tiến',     role: 'prod',   is_leader: false },
      { username: 'sanxuat2',  name: 'In & Bao Bì Minh Khoa',   role: 'prod',   is_leader: false },
      { username: 'sanxuat3',  name: 'PrintPro Việt Nam',       role: 'prod',   is_leader: false },
      { username: 'admin1',    name: 'Admin Dashboard',         role: 'admin',  is_leader: true  },
    ];

    const now = new Date();
    await queryInterface.bulkInsert('users',
      users.map(u => ({
        ...u,
        password_hash: HASH,
        permissions: JSON.stringify({}),
        is_active: true,
        created_at: now,
        updated_at: now,
      }))
    );

    // Get inserted user IDs for suppliers
    const [inserted] = await queryInterface.sequelize.query(
      "SELECT id, username FROM users WHERE username IN ('sanxuat1','sanxuat2','sanxuat3')"
    );
    const byUsername = Object.fromEntries(inserted.map(u => [u.username, u.id]));

    // Insert suppliers linked to prod users
    await queryInterface.bulkInsert('suppliers', [
      {
        name: 'Công ty In Tân Tiến',
        cats: JSON.stringify(['In nhanh', 'Offset', 'Thiết kế']),
        is_active: true,
        user_id: byUsername['sanxuat1'] || null,
        created_at: now, updated_at: now,
      },
      {
        name: 'In & Bao Bì Minh Khoa',
        cats: JSON.stringify(['Hộp sóng', 'Hộp mềm', 'Hộp cứng']),
        is_active: true,
        user_id: byUsername['sanxuat2'] || null,
        created_at: now, updated_at: now,
      },
      {
        name: 'PrintPro Việt Nam',
        cats: JSON.stringify(['Quà tặng', 'Ấn phẩm khác', 'Thiết kế']),
        is_active: true,
        user_id: byUsername['sanxuat3'] || null,
        created_at: now, updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('suppliers', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
