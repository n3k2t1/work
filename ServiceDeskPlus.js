/**
 *
 * @param {} endpoint
 * @returns
 */
'use strict';

function ServiceDeskPlus(endpoint = '') {

    // API 実行
    const __invokeApi__ = function (options) {

        // パラメーター(複数 ID)の振り分け
        if (options.module.ids && options.module.ids.length > 1) {
            const value = options.module.ids.join(',');
            if (options.method.toUpperCase() === 'GET') {
                if (!options.query) { options.query = {}; }
                options.query['ids'] = value;
            } else {
                if (!options.body) { options.body = {}; }
                options.body['ids'] = value;
            }
        }

        // ----------------------------------------
        let url = endpoint.trim().replace(/\/$/, '');
        const _options = {
            method: options.method,
        };

        // ----------------------------------------
        // モジュール階層
        // ----------------------------------------

        // エンドポイント
        url += options.module.endpoint;
        // ID
        if (options.module.ids && options.module.ids.length == 1) {
            url += `/${options.module.ids[0]}`;
        }
        // 追加パス
        if (options.module.subpath) {
            url += options.module.subpath;
        }

        // ----------------------------------------
        // サブモジュール階層
        // ----------------------------------------

        if (options.submodule) {
            // エンドポイント
            url += options.submodule.endpoint;
            // ID
            if (options.submodule.id) {
                url += `/${options.submodule.id}`;
            }
            // 追加パス
            if (options.submodule.subpath) {
                url += options.submodule.subpath;
            }
        }

        // ----------------------------------------
        // API パラメーター
        // ----------------------------------------

        // Object -> URLSearchParams 変換
        const fn = function (obj) {
            const params = new URLSearchParams();
            Object.keys(obj).forEach(key => {
                let value = obj[key];
                // 有効な値を持たないキーは除外する
                if (value !== undefined) {
                    if (key === 'input_data') {
                        value = JSON.stringify(value);
                    }
                    params.append(key, value);
                }
            });
            return params;
        }

        // クエリーストリング
        if (options.query && Object.keys(options.query).length) {
            url += `?${fn(options.query).toString()}`;
        }

        // リクエストボディ (application/x-www-form-urlencoded 形式)
        if (options.body && Object.keys(options.body).length) {
            _options.body = fn(options.body);
        }

        // リクエストボディ (multipart/form-data 形式)
        if (options.file) {
            const form = new FormData();
            form.append('input_file', options.file, options.file.name);
            _options.body = form;
        }

        // ----------------------------------------
        // リクエスト送信
        // ----------------------------------------

        // const res = fetch(url, _options);
        console.log(`${_options.method}:${url}`);

        // レスポンスの内容確認

    }

    // APIv3 の共通機能 (基本 API)
    const __BaseV3__ = function (options) {

        return {
            // 追加
            add: function (data) {

                const _options = {
                    module: {
                        endpoint: options.module.endpoint,
                        // この API は ids を使用しない
                    },
                    method: 'POST',
                    body: {
                        'input_data': {
                            [options.entity]: data
                        },
                    },
                };

                return __invokeApi__(_options);
            },
            // 参照
            get: function (...fieldsRequired) {

                const _options = {
                    module: {
                        endpoint: options.module.endpoint,
                        ids: options.module.ids,
                    },
                    method: 'GET',
                    query: {
                        'input_data': {},
                    },
                };

                if (fieldsRequired.length) {
                    _options.query = {
                        'input_data': {
                            'list_info': {
                                'fields_required': fieldsRequired
                            }
                        }
                    };
                }

                return __invokeApi__(_options);
            },
            getList: function (listInfo, ...fieldsRequired) {

                const _options = {
                    module: {
                        endpoint: options.module.endpoint,
                        // この API は ids を使用しない
                    },
                    method: 'GET',
                    query: {
                        'input_data': {},
                    },
                };

                if (listInfo) {

                }

                if (fieldsRequired.length) {
                    if (!('input_data' in _options.query)) {
                        _options.query.input_data = {};
                    }
                    _options.query.input_data.fields_required = fieldsRequired;
                }

                return __invokeApi__(_options);
            },
            getListAll: function (listInfo, ...fieldsRequired) {

                // 全検索のたの出力条件
                const _listInfo = {
                    'row_count': 100,
                    'sort_fields': 'id',
                    'sort_order': 'asc',
                };

                // 全検索のたの検索条件
                const criteria = {
                    'search_criteria': [{
                        'field': 'id',
                        'condition': 'greater than',
                        'value': 0,
                        'logical_operator': 'AND',
                    }]
                };

                while (true) {
                    const res = this.getList(_listInfo, fieldsRequired);
                    // TODO
                    //
                    if (!res.list_info.has_more_rows) { break; }
                    //
                    const max = Math.max(...res[options.module.entities].map(x => Number(x.id)));
                    _listInfo.search_criteria[-1].value = max;
                }

                //
                return res;
            },
            // 更新
            update: function (data) {

                const _options = {
                    module: {
                        endpoint: options.module.endpoint,
                        ids: options.module.ids,
                    },
                    method: 'PUT',
                    body: {
                        'input_data': {
                            [options.entity]: data,
                        },
                    },
                };

                return __invokeApi__(_options);
            },
            // 削除
            delete: function () {

                const _options = {
                    module: {
                        endpoint: options.module.endpoint,
                        ids: options.module.ids,
                    },
                    method: 'DELETE',
                    body: {},
                };

                return __invokeApi__(_options);
            },
            // メタ情報
            metainfo: function () {

                const _options = {
                    module: {
                        endpoint: options.module.endpoint,
                        // この API は ids を使用しない
                        subpath: '/metainfo',
                    },
                    method: 'GET',
                };

                return __invokeApi__(_options);
            },
        }
    }

    // APIv3 の共通機能 (添付ファイル)
    const __AttachmentsV3__ = function (options) {

        const ENDPOINT = '/attachments';

        return {
            // 添付ファイル追加
            upload: function (file) {

                const _options = {
                    module: options.module,
                    submodule: {
                        // /attachments 階層でないことに注意
                        endpoint: '',
                        subpath: '/upload',
                    },
                    method: 'PUT',
                    file: file,
                }

                return __invokeApi__(_options);
            },
            Attachments: function (id) {

                return {
                    // 添付ファイル一覧
                    get: function () {

                        const _options = {
                            module: options.module,
                            submodule: {
                                endpoint: ENDPOINT,
                                // この API は ids を使用しない
                            },
                            method: 'GET',
                        }

                        return __invokeApi__(_options);
                    },
                    // 添付ファイルダウンロード
                    download: function () {

                        const _options = {
                            module: options.module,
                            submodule: {
                                endpoint: ENDPOINT,
                                id: id,
                                subpath: '/download',
                            },
                            method: 'GET',
                        }

                        return __invokeApi__(_options);
                    },
                    // 添付ファイル削除
                    delete: function () {

                        const _options = {
                            module: options.module,
                            submodule: {
                                endpoint: ENDPOINT,
                                id: id,
                            },
                            method: 'DELETE',
                        }

                        return __invokeApi__(_options);
                    },
                }
            }
        }
    }

    const __SDAjaxServlet__ = function () {

        const ENDPOINT = '/SDAjaxServlet';

        return {
            getAllowedValues: function (module, id, requiredFormat) {
                const _options = {
                    module: {
                        endpoint: ENDPOINT,
                    },
                    method: 'GET',
                    query: {
                        action: 'GetAllowedValues',
                        module: module,
                        templateId: id,
                        requiredFormat: requiredFormat,
                    }
                }
                //
                return __invokeApi__(_options);
            },
            getFieldJson: function (module, id) {
                const _options = {
                    module: {
                        endpoint: ENDPOINT,
                    },
                    method: 'GET',
                    query: {
                        action: 'getFieldJson',
                        module: module,
                        templateId: id,
                    }
                }
                //
                return __invokeApi__(_options);
            },
        }
    }

    // 利用可能な機能セット
    return {
        // リクエスト編集画面モジュール
        SDAjaxServlet: __SDAjaxServlet__(),
        // APIv3 機能モジュール
        ApiV3: {
            //
            Requests: function (...ids) {

                const ENDPOINT = '/api/v3/requests';
                const ENTITY = 'request';
                const ENTITIES = 'requests';
                //
                const obj = {};

                // 基本 API
                Object.assign(obj, __BaseV3__({
                    module: {
                        endpoint: ENDPOINT,
                        entity: ENTITY,
                        entities: ENTITIES,
                        ids: ids,
                    }
                }));

                // 添付ファイル API
                Object.assign(obj, __AttachmentsV3__({
                    module: {
                        endpoint: ENDPOINT,
                        ids: ids,
                    }
                }));

                return obj;
            },
            //
            Users: function (...ids) {

                const ENDPOINT = '/api/v3/users';
                const ENTITY = 'user';
                const ENTITIES = 'users';
                //
                const obj = {};

                // 基本 API
                Object.assign(obj, __BaseV3__({
                    module: {
                        endpoint: ENDPOINT,
                        entity: ENTITY,
                        entities: ENTITIES,
                        ids: ids,
                    }
                }));

                return obj;
            }
        }
    }
}

const sdp = ServiceDeskPlus('https://localhost');

sdp.ApiV3.Requests(1).get();
// sdp.ApiV3.Requests(1).upload(new File());
sdp.ApiV3.Requests(20).delete()
sdp.ApiV3.Requests(20).Attachments(100).download()
sdp.ApiV3.Users(11).update();
sdp.SDAjaxServlet.getAllowedValues('INCIDENT', 18);
