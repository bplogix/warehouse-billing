module.exports = {
  root: true,

  // 根目录关闭 TS 类型检查，只做语法检查
  parserOptions: {
    project: null, 
    tsconfigRootDir: __dirname,
  },

  ignorePatterns: ['**/dist', '**/.turbo', '**/node_modules'],
  extends: [],
}
