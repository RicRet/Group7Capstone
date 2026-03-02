import { fireEvent, render } from '@testing-library/react-native';
import Home from '../../EagleGuide/app/homepage';

const pushMock = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn() }),
  useLocalSearchParams: () => ({ email: 'test@example.com' }),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMap = ({ children }: any) => <View>{children}</View>;
  const Marker = ({ children }: any) => <View>{children}</View>;
  return { __esModule: true, default: MockMap, Marker };
});

jest.mock('../../EagleGuide/app/lib/api/shareLocation', () => ({
  createShareLocation: jest.fn().mockResolvedValue({ shareId: 'share-1' }),
}));

describe('Home screen', () => {
  it('shows quick actions and navigates to add route (BC-001, BC-002)', () => {
    const { getByText } = render(<Home />);
    const addRouteButton = getByText('Add Route');
    fireEvent.press(addRouteButton);
    expect(pushMock).toHaveBeenCalledWith('/addroute');
  });
});
