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
            id: 'auth_id_1', // 授权的id，用于context.fetch第三个参数以区分该请求使用哪个授权
            platform: 'baidu', // 需要与之授权的平台,比如baidu(必须要是已经支持的三方凭证,不可随便填写,如果想要支持更多的凭证，请填写申请表单)
            type: block_basekit_server_api_1.AuthorizationType.HeaderBearerToken,
            required: false, // 设置为选填，用户如果填了授权信息，请求中则会携带授权信息，否则不带授权信息
            instructionsUrl: "https://www.saas.jcbbi.com/", // 帮助链接，告诉使用者如何填写这个apikey
            label: '测试授权',
            icon: {
                light: '',
                dark: ''
            }
        }
    ],
    // 定义捷径的i18n语言资源
    i18n: {
        messages: {
            'zh-CN': {
                "param_image_label": "图片",
                "param_prompt_label": "提示词",
            },
        }
    },
    // 定义捷径的入参
    formItems: [
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
    ],
    // 定义捷径的返回结果类型，返回文字
    resultType: {
        type: block_basekit_server_api_1.FieldType.Text,
    },
    // formItemParams 为运行时传入的字段参数，对应字段配置里的 formItems （如引用的依赖字段）
    execute: async (formItemParams, context) => {
        // 获取入参 - 开发者可以根据自己的字段配置获取相应参数
        const { imageUrl1, prompt } = formItemParams;
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
            // 1. 调用Gemini API
            const url = 'https://api.ezlinkai.com/v1beta/models/gemini-3-pro-preview:generateContent';
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 2O13DgDpmdia619m9c14E981149347068808B386A17bCbAb'
            };
            // Build request payload
            const requestBody = {
                model: "gemini-3-pro-preview",
                "contents": [{
                        "role": "user",
                        "parts": []
                    }],
                "generationConfig": {
                    "responseModalities": ["TEXT"]
                }
            };
            // Add images first (inlineData with camelCase)
            if (Array.isArray(imageUrl1) && imageUrl1.length > 0 && imageUrl1[0]?.tmp_url) {
                const image = imageUrl1[0];
                try {
                    // Fetch the image from the temporary URL
                    const imageResponse = await context.fetch(image.tmp_url);
                    const arrayBuffer = await imageResponse.arrayBuffer();
                    // Convert ArrayBuffer to Buffer
                    const buffer = Buffer.from(arrayBuffer);
                    // Convert Buffer to base64 string without data URI prefix
                    const base64 = buffer.toString('base64');
                    const contentType = image.type || 'image/png';
                    // Add image to request using inlineData (camelCase)
                    requestBody.contents[0].parts.push({
                        "inlineData": {
                            "data": base64,
                            "mimeType": contentType
                        }
                    });
                }
                catch (error) {
                    debugLog({ '===图片处理错误': String(error) });
                }
            }
            // Add prompt text last
            requestBody.contents[0].parts.push({
                "text": prompt
            });
            const init = {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody)
            };
            // 使用封装的fetch函数，确保日志记录完整
            // debugLog({ '===请求参数': init });
            // debugLog({ '===请求参数': JSON.stringify(requestBody, null, 2) });
            // 直接使用context.fetch
            const res = await context.fetch(url, init, 'auth_id_1');
            // debugLog({ '===响应内容': res });
            // debugLog({ '===响应状态': res.status });
            // 2. 处理响应
            try {
                const resJson = await res.json();
                debugLog({ '===完整响应': JSON.stringify(resJson) });
                // 解析响应，获取文字结果
                let resultText = '';
                // 检查candidates是否存在
                if (resJson.candidates && Array.isArray(resJson.candidates) && resJson.candidates.length > 0) {
                    const candidate = resJson.candidates[0];
                    debugLog({ '===candidate': JSON.stringify(candidate) });
                    // 检查content
                    if (candidate.content) {
                        const content = candidate.content;
                        debugLog({ '===content': JSON.stringify(content) });
                        // 检查parts
                        if (content.parts && Array.isArray(content.parts)) {
                            debugLog({ '===parts数量': content.parts.length });
                            // 查找text类型的content
                            for (const part of content.parts) {
                                if (part.text) {
                                    resultText = part.text;
                                    debugLog({ '===找到text': resultText.substring(0, 100) });
                                    break;
                                }
                            }
                        }
                    }
                }
                // debugLog({ '===最终提取的text': resultText.substring(0, 100) });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtRkFBK0o7QUFFL0osTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLGdDQUFLLENBQUM7QUFFcEIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxXQUFXLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ3JGLHFEQUFxRDtBQUNyRCxrQ0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLHdCQUF3QixFQUFFLGtCQUFrQixFQUFFLG1DQUFtQyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztBQUUvSyxrQ0FBTyxDQUFDLFFBQVEsQ0FBQztJQUNmLGNBQWMsRUFBRTtRQUNkO1lBQ0UsRUFBRSxFQUFFLFdBQVcsRUFBQyx5Q0FBeUM7WUFDekQsUUFBUSxFQUFFLE9BQU8sRUFBQyw4REFBOEQ7WUFDaEYsSUFBSSxFQUFFLDRDQUFpQixDQUFDLGlCQUFpQjtZQUN6QyxRQUFRLEVBQUUsS0FBSyxFQUFDLHdDQUF3QztZQUN4RCxlQUFlLEVBQUUsNkJBQTZCLEVBQUMseUJBQXlCO1lBQ3hFLEtBQUssRUFBRSxNQUFNO1lBQ2IsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRSxFQUFFO2dCQUNULElBQUksRUFBRSxFQUFFO2FBQ1Q7U0FDRjtLQUNGO0lBQ0QsZ0JBQWdCO0lBQ2hCLElBQUksRUFBRTtRQUNKLFFBQVEsRUFBRTtZQUNSLE9BQU8sRUFBRTtnQkFDUCxtQkFBbUIsRUFBRSxJQUFJO2dCQUN6QixvQkFBb0IsRUFBRSxLQUFLO2FBQzVCO1NBQ0Y7S0FDRjtJQUNELFVBQVU7SUFDVixTQUFTLEVBQUU7UUFDVDtZQUNFLEdBQUcsRUFBRSxXQUFXO1lBQ2hCLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxF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