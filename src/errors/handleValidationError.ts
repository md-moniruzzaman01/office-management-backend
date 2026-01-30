import { IGenericErrorResponse } from '../interfaces/common';

const handleValidationError = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
): IGenericErrorResponse => {
  const errors = [
    {
      path: '',
      message: error.message,
    },
  ];
  const statusCode = 400;
  return {
    statusCode,
    message: 'Validation Error',
    errorMessages: errors,
  };
};

export default handleValidationError;
