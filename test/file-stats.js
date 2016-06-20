'use strict';

const path = require('path');
const assert = require('assert');
const stats = require('../');

describe('File stats', () => {
    let baseDir = path.resolve(__dirname, 'files');
    let staticFileDirs = [
        path.resolve(baseDir, 'inner')
    ];

    it('get file stats', () => {
        assert.equal(stats('/foo.txt', {baseDir}).hash, '2117232040');
        assert.equal(stats('/bar.txt', {baseDir, staticFileDirs}).hash, '77771753');
        assert.throws(() => stats('/bar.txt', {baseDir}).hash, /Unable to locate file/);
    });
});
