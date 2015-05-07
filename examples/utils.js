var Utils = {
    /**
     * @method download
     * @param {String} url
     * @param {String} [type] If the value is "array_buffer", the url is
     *   downloaded as an ArrayBuffer. Otherwise, it's downloaded as text.
     * @return {Promise} A promise for the downloaded data.
     */
    download: function(url, type) {
        var deferred = Q.defer();
        var xhr = new XMLHttpRequest;
        xhr.onload = function(e) {
            if (xhr.status == 404)
                deferred.reject(new NotFoundError('Not found: ' + url));
            else
                deferred.resolve(type == 'array_buffer' ? this.response : this.responseText);
        }
        xhr.onerror = function(e) {
            deferred.reject(e);
        }
        xhr.open('get', url, true);
        if (type == 'array_buffer')
            xhr.responseType = 'arraybuffer';
        xhr.send();
        return deferred.promise;
    }
};
