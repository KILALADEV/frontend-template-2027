/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-recess-order'],
  ignoreFiles: ['dist/**/*', 'node_modules/**/*', '.astro/**/*'],
  overrides: [
    {
      files: ['*.scss', '**/*.scss'],
      customSyntax: 'postcss-scss',
    },
    {
      files: ['*.astro', '**/*.astro'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    // BEM / FLOCSS 系の命名（.c-card__title--active など）を許可
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,
    'scss/dollar-variable-pattern': null,
    'scss/at-mixin-pattern': null,
    'scss/at-function-pattern': null,

    // LP では上書き前提の記述が多いため無効化
    'no-descending-specificity': null,

    // 画像やフォントのパスに使う URL のクォートは統一する
    'function-url-quotes': 'always',

    // 空ソースはビルド途中に発生しうるので許容
    'no-empty-source': null,

    // Hỗ trợ cú pháp CSS Nesting tiêu chuẩn (giới hạn sâu tối đa 3 cấp)
    'max-nesting-depth': [
      3,
      {
        ignore: ['blockless-at-rules', 'pseudo-classes'],
      },
    ],
  },
};
