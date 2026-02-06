import { basekit, FieldType, field, FieldComponent, FieldCode, NumberFormatter, AuthorizationType, DateFormatter } from '@lark-opdev/block-basekit-server-api';

const { t } = field;

const feishuDm = ['feishu.cn', 'feishucdn.com', 'larksuitecdn.com', 'larksuite.com'];
// 通过addDomainList添加请求接口的域名，不可写多个addDomainList，否则会被覆盖
basekit.addDomainList([...feishuDm, 'api.example.com', '121.40.190.107', 'dashscope.aliyuncs.com', 'api.ezlinkai.com', 'generativelanguage.googleapis.com', 'saas.jcbbi.com']);

basekit.addField({
  authorizations: [
    {
      id: 'auth_id',// 授权的id，用于context.fetch第三个参数以区分该请求使用哪个授权
      platform: '毛毛虫',// 需要与之授权的平台,比如baidu(必须要是已经支持的三方凭证,不可随便填写,如果想要支持更多的凭证，请填写申请表单)
      type: AuthorizationType.HeaderBearerToken,
      required: false,// 设置为选填，用户如果填了授权信息，请求中则会携带授权信息，否则不带授权信息
      instructionsUrl: "https://www.mmcjt.cn/",// 帮助链接，告诉使用者如何填写这个apikey
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
      component: FieldComponent.Input,
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
      component: FieldComponent.FieldSelect,
      props: {
        supportType: [FieldType.Attachment],
      },
      validator: {
        required: false,
      }
    },
    {
      key: 'temperature',
      label: t('param_temperature_label'),
      component: FieldComponent.Input,
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
      component: FieldComponent.Input,
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
      component: FieldComponent.Input,
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
      component: FieldComponent.Input,
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
    type: FieldType.Text,
  },
  // formItemParams 为运行时传入的字段参数，对应字段配置里的 formItems （如引用的依赖字段）
  execute: async (formItemParams, context) => {
    // 获取入参 - 开发者可以根据自己的字段配置获取相应参数
    const { imageUrl1, prompt, temperature, top_p, top_K, candidateCount } = formItemParams;

    /** 
     * 为方便查看日志，使用此方法替代console.log
     * 开发者可以直接使用这个工具函数进行日志记录
     */
    function debugLog(arg: any, showContext = false) {
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
        'Authorization': 'Bearer Bvvw1Y5LRwNnzTIe2446Ed1802E5472b81AaDdF0Cd3fBa3a'
      };

      // Build request payload
      const requestBody: any = {
        model: "gemini-3-pro-preview",
        "contents": [{
          "role": "user",
          "parts": []
        }],
        "generationConfig": {
          "temperature": Number(temperature),
          "topP": Number(top_p),
          "topK": Number(top_K),
          "candidateCount": Number(candidateCount),
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
        } catch (error) {
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
      const res = await context.fetch(url, init, 'auth_id');
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
          code: FieldCode.Success,
          data: resultText,
        };
      } catch (e) {
        debugLog({ '===读取响应错误': String(e) });
        return {
          code: FieldCode.Error,
        };
      }
    } catch (e) {
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
        code: FieldCode.Error,
      };
    }
  },
});
export default basekit;