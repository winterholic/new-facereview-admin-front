import type { InputHTMLAttributes, ReactElement } from 'react';

import './textInput.scss';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const TextInput = ({ label, id, ...rest }: TextInputProps): ReactElement => (
  <div className="text-input">
    {label && (
      <label htmlFor={id} className="text-input__label font-label-small">
        {label}
      </label>
    )}
    <input id={id} className="text-input__field font-body-medium" {...rest} />
  </div>
);

export default TextInput;
