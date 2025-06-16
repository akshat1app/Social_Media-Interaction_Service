import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { HttpAdapterHost } from '@nestjs/core';
  import { I18nContext } from 'nestjs-i18n';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private httpAdapterHost: HttpAdapterHost) {}
    private readonly logger = new Logger(AllExceptionsFilter.name);
  
    catch(exception: unknown, host: ArgumentsHost) {
      console.log('HERE !!!');
      this.logger.error(exception);
      const ctx = host.switchToHttp();
      let status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
  
      let type: string | string[];
      let error = 'Sorry, something went wrong';
      let msg = exception?.['response']?.message ?? exception;
      let msgType;
      const { httpAdapter } = this.httpAdapterHost;
      const path = httpAdapter.getRequestUrl(ctx.getRequest());
      if (exception instanceof HttpException) {
        const res = exception.getResponse();
        status = res['statusCode'] ? res['statusCode'] : status;
        const i18n = I18nContext.current();
        if (i18n) {
          type = res['message'];
          if (type instanceof Array) {
            msg = type[0];
          } else if (type) {
            const lang = i18n.lang;
            msgType = type;
            // if translateMsgType is undefined i.e(en.undefined) then set msgType
            const translateMsgType = `${lang}.${msgType}`;
            console.log({ translateMsgType });
            const translatedMsg = i18n.t(translateMsgType);
            const message =
              translatedMsg !== translateMsgType ? translatedMsg : msgType;
            msg = message as string;
          }
        }
        error = res['error'];
      }
      
      const errorBody = {
        statusCode: status,
        error: msgType || 'VALIDATION_ERROR',
        message: msg,
        type: error,
      };
  
      this.logger.error(errorBody);
  
      httpAdapter.reply(
        ctx.getResponse(), errorBody, status);
    }
  }
  