"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const block_basekit_server_api_1 = require("@lark-opdev/block-basekit-server-api");
const { t } = block_basekit_server_api_1.field;
const feishuDm = ['feishu.cn', 'feishucdn.com', 'larksuitecdn.com', 'larksuite.com'];
// 通过addDomainList添加请求接口的域名，不可写多个addDomainList，否则会被覆盖
block_basekit_server_api_1.basekit.addDomainList([...feishuDm, 'api.example.com', '121.40.190.107', 'dashscope.aliyuncs.com', 'api.ezlinkai.com', 'generativelanguage.googleapis.com', 'saas.jcbbi.com']);
block_basekit_server_api_1.basekit.addField({
    authorizations: [
        {
            id: 'auth_id', // 授权的id，用于context.fetch第三个参数以区分该请求使用哪个授权
            platform: '毛毛虫', // 需要与之授权的平台,比如baidu(必须要是已经支持的三方凭证,不可随便填写,如果想要支持更多的凭证，请填写申请表单)
            type: block_basekit_server_api_1.AuthorizationType.HeaderBearerToken,
            required: false, // 设置为选填，用户如果填了授权信息，请求中则会携带授权信息，否则不带授权信息
            instructionsUrl: "https://www.mmcjt.cn/", // 帮助链接，告诉使用者如何填写这个apikey
            label: '授权',
            icon: {
                light: 'https://saas.jcbbi.com/upload/2026/01/29/767965034025029.jpg',
                dark: 'https://saas.jcbbi.com/upload/2026/01/29/767965034025029.jpg'
            }
        }
    ],
    // 定义捷径的i18n语言资源
    i18n: {
        messages: {
            'zh-CN': {
                "param_image_label": "图片",
                "param_prompt_label": "提示词",
                "param_temperature_label": "Temperature",
                "param_top_p_label": "topP",
                "param_top_K_label": "topK",
                "param_candidateCount_label": "candidateCount",
            },
        }
    },
    // 定义捷径的入参
    formItems: [
        {
            key: 'prompt',
            label: t('param_prompt_label'),
            component: block_basekit_server_api_1.FieldComponent.Input,
            props: {
                placeholder: '请输入图片编辑指令',
            },
            validator: {
                required: true,
            }
        },
        {
            key: 'imageUrl1',
            label: `${t('param_image_label')}`,
            component: block_basekit_server_api_1.FieldComponent.FieldSelect,
            props: {
                supportType: [block_basekit_server_api_1.FieldType.Attachment],
            },
            validator: {
                required: false,
            }
        },
        {
            key: 'temperature',
            label: t('param_temperature_label'),
            component: block_basekit_server_api_1.FieldComponent.Input,
            props: {
                placeholder: '请输入0.0-2.0之间数字',
            },
            validator: {
                required: false,
            }
        },
        {
            key: 'top_p',
            label: t('param_top_p_label'),
            component: block_basekit_server_api_1.FieldComponent.Input,
            props: {
                placeholder: '请输入0.0-1.0之间数字',
            },
            validator: {
                required: false,
            }
        },
        {
            key: 'top_K',
            label: t('param_top_K_label'),
            component: block_basekit_server_api_1.FieldComponent.Input,
            props: {
                placeholder: '请输入10-100之间数字',
            },
            validator: {
                required: false,
            }
        },
        {
            key: 'candidateCount',
            label: t('param_candidateCount_label'),
            component: block_basekit_server_api_1.FieldComponent.Input,
            props: {
                placeholder: '请输入1-8之间数字',
            },
            validator: {
                required: false,
            }
        },
    ],
    // 定义捷径的返回结果类型，返回文字
    resultType: {
        type: block_basekit_server_api_1.FieldType.Text,
    },
    // formItemParams 为运行时传入的字段参数，对应字段配置里的 formItems （如引用的依赖字段）
    execute: async (formItemParams, context) => {
        // 获取入参 - 开发者可以根据自己的字段配置获取相应参数
        const { imageUrl1, prompt, temperature, top_p, top_K, candidateCount } = formItemParams;
        /**
         * 为方便查看日志，使用此方法替代console.log
         * 开发者可以直接使用这个工具函数进行日志记录
         */
        function debugLog(arg, showContext = false) {
            // @ts-ignore
            if (!showContext) {
                console.log(JSON.stringify({ arg, logID: context.logID }), '\n');
                return;
            }
            console.log(JSON.stringify({
                formItemParams,
                context,
                arg
            }), '\n');
        }
        // 入口第一行日志，展示formItemParams和context，方便调试
        // 每次修改版本时，都需要修改日志版本号，方便定位问题
        debugLog('=====start=====v1', true);
        try {
            // 1. 收集所有图片的临时URL
            const imageFields = [imageUrl1];
            const tmpUrls = [];
            for (const imageField of imageFields) {
                // 每个imageField是一个图片数组，可能包含多张图片
                if (Array.isArray(imageField)) {
                    for (const image of imageField) {
                        if (image?.tmp_url) {
                            tmpUrls.push(image.tmp_url);
                        }
                    }
                }
            }
            // 1. 调用Gemini API
            const url = 'https://saas.jcbbi.com:8180/api/sysChatChannel/messagebuilderchat';
            // 飞书公共插件
            const headers = {
                'Content-Type': 'application/json',
            };
            // Build request payload
            const requestBody = {
                "model": "gemini-3-pro-preview",
                "content": prompt,
                "imageUrls": tmpUrls,
                "temperature": Number(temperature),
                "topP": Number(top_p),
                "topK": Number(top_K),
                "candidateCount": Number(candidateCount),
            };
            const init = {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            };
            // 直接使用context.fetch
            const res = await context.fetch(url, init, 'auth_id');
            debugLog({ '===响应内容': res });
            // 2. 处理响应
            try {
                const resJson = await res.json();
                debugLog({ '===完整响应': resJson });
                // 解析响应，获取文字结果
                let resultText = '';
                if (resJson.code === 200 && resJson.result && resJson.result.message) {
                    resultText = resJson.result.message;
                }
                else {
                    resultText = '请联系管理员';
                }
                // 返回文字结果
                return {
                    code: block_basekit_server_api_1.FieldCode.Success,
                    data: resultText,
                };
            }
            catch (e) {
                debugLog({ '===读取响应错误': String(e) });
                return {
                    code: block_basekit_server_api_1.FieldCode.Error,
                };
            }
        }
        catch (e) {
            // 4. 捕获未知错误 - 系统异常时的处理
            debugLog({
                '===999 未知错误': String(e)
            });
            /**
             * 返回非 Success 的错误码，将会在单元格上显示报错
             * 请勿返回msg、message之类的字段，它们并不会起作用
             * 对于未知错误，请直接返回 FieldCode.Error，然后通过查日志来排查错误原因
             */
            return {
                code: block_basekit_server_api_1.FieldCode.Error,
            };
        }
    },
});
exports.default = block_basekit_server_api_1.basekit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtRkFBK0o7QUFFL0osTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLGdDQUFLLENBQUM7QUFFcEIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxXQUFXLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ3JGLHFEQUFxRDtBQUNyRCxrQ0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLHdCQUF3QixFQUFFLGtCQUFrQixFQUFFLG1DQUFtQyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztBQUUvSyxrQ0FBTyxDQUFDLFFBQVEsQ0FBQztJQUNmLGNBQWMsRUFBRTtRQUNkO1lBQ0UsRUFBRSxFQUFFLFNBQVMsRUFBQyx5Q0FBeUM7WUFDdkQsUUFBUSxFQUFFLEtBQUssRUFBQyw4REFBOEQ7WUFDOUUsSUFBSSxFQUFFLDRDQUFpQixDQUFDLGlCQUFpQjtZQUN6QyxRQUFRLEVBQUUsS0FBSyxFQUFDLHdDQUF3QztZQUN4RCxlQUFlLEVBQUUsdUJBQXVCLEVBQUMseUJBQXlCO1lBQ2xFLEtBQUssRUFBRSxJQUFJO1lBQ1gsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRSw4REFBOEQ7Z0JBQ3JFLElBQUksRUFBRSw4REFBOEQ7YUFDckU7U0FDRjtLQUNGO0lBQ0QsZ0JBQWdCO0lBQ2hCLElBQUksRUFBRTtRQUNKLFFBQVEsRUFBRTtZQUNSLE9BQU8sRUFBRTtnQkFDUCxtQkFBbUIsRUFBRSxJQUFJO2dCQUN6QixvQkFBb0IsRUFBRSxLQUFLO2dCQUMzQix5QkFBeUIsRUFBRSxhQUFhO2dCQUN4QyxtQkFBbUIsRUFBRSxNQUFNO2dCQUMzQixtQkFBbUIsRUFBRSxNQUFNO2dCQUMzQiw0QkFBNEIsRUFBRSxnQkFBZ0I7YUFDL0M7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