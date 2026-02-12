import { act, fireEvent, render } from '@testing-library/react-native';
import Login from '../../EagleGuide/app/Login';
import Signup from '../../EagleGuide/app/Signup';

jest.mock('../../EagleGuide/app/lib/api/login', () => ({
  login: jest.fn().mockResolvedValue({ token: 't', user: { id: '1', roles: [] } }),
}));

jest.mock('../../EagleGuide/app/lib/api/signup', () => ({
  signUp: jest.fn().mockResolvedValue({ message: 'ok' }),
}));

describe('Login screen', () => {
  it('masks password input and warns on missing credentials (BC-100, BC-103, LG-01)', async () => {
    const { getByPlaceholderText, getByText } = render(<Login />);

    const passwordInput = getByPlaceholderText('Password');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    await act(async () => {
      fireEvent.press(getByText('Login'));
    });

    expect(getByText('Please enter username and password. Please try again.')).toBeTruthy();
  });
});

describe('Signup screen', () => {
  it('disables submit until password requirements are met (BC-102)', async () => {
    const { getByPlaceholderText, getByText } = render(<Signup />);

    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');
    const confirmInput = getByPlaceholderText('Confirm Password');
    const submitText = getByText('Create Account');
    const submitButton = submitText.parent as any;

    expect(submitButton?.props.disabled).toBe(true);

    await act(async () => {
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'Passw0rd!');
      fireEvent.changeText(confirmInput, 'Passw0rd!');
    });

    const submitEnabled = (submitText.parent as any)?.props.disabled === false;
    expect(submitEnabled).toBe(true);
  });
});
