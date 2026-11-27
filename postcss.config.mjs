import autoprefixer from 'autoprefixer';

/** ベンダープレフィックスの付与対象は .browserslistrc で管理する */
export default {
    plugins: [autoprefixer()],
};
