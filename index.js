/**
 * Get stats of given file path.
 */

'use strict';
const path = require('path');
const fs = require('fs');
const crc = require('crc');

const fileStatCache = {};
const defaultConfig = {
	statCacheTime: 10000
};

module.exports = function(url, config) {
	config = Object.assign({}, defaultConfig, config || {});
	let lookups = [path.join(config.baseDir, url)];
	if (config.staticFileDirs) {
		let lookupDirs = Array.isArray(config.staticFileDirs)
			? config.staticFileDirs
			: [config.staticFileDirs];

		lookupDirs.forEach(dir => lookups.push(path.join(dir, url)));
	}

	return tryFiles(url, lookups, config);
};

function tryFiles(url, lookups, config) {
    invalidateCache(url, config);
    if (!fileStatCache[url]) {
        for (let i = 0; i < lookups.length; i++) {
            try {
    			let stats = fs.statSync(lookups[i]);
    			if (stats.isFile()) {
                    putInCache(url, stats, lookups[i]);
                    break;
    			}
    		} catch (e) {}
        }
    }

    if (!fileStatCache[url]) {
        // still no file, save error result instead
        let error = new Error(`Unable to locate file for "${url}" url`);
        error.code = 'ENOENT';
        putInCache(url, error);
    }

	return fileStatCache[url].stats;
}

function invalidateCache(key, config) {
    if (key in fileStatCache && fileStatCache[key].created < Date.now() + config.statCacheTime) {
        delete fileStatCache[key];
    }
}

function putInCache(key, data, file) {
    var stats = {
        get hash() {
            if (this.error) {
                throw new Error(this.error);
            }

            if (!this._hash) {
                this._hash = crc.crc32(fs.readFileSync(this.file));
            }

            return this._hash;
        }
    };

    if (data instanceof Error) {
        stats.error = data;
    } else {
        stats.file = file;
        stats.modified = data.mtime;
        stats.created = data.birthtime;
        stats.size = data.size;
        stats.inode = data.ino;
    }

    fileStatCache[key] = {stats, created: Date.now()};
    return fileStatCache[key];
}
