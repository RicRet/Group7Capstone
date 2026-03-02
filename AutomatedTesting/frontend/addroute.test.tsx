import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Addroute from '../../EagleGuide/app/addroute';

const addRouteMock = jest.fn().mockResolvedValue({ message: 'Route saved' });
const deleteRouteMock = jest.fn().mockResolvedValue({ message: 'Route deleted' });
const getRoutesMock = jest.fn().mockResolvedValue([]);

jest.mock('../../EagleGuide/app/lib/api/addroutev2', () => ({
  addRoute: (...args: any[]) => addRouteMock(...args),
  deleteRoute: (...args: any[]) => deleteRouteMock(...args),
  getRoutes: (...args: any[]) => getRoutesMock(...args),
}));

jest.mock('react-native-dropdown-picker', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return ({ items = [], setValue, testID }: any) => (
    <View>
      <TouchableOpacity testID={testID || 'picker'} onPress={() => setValue(() => items[0]?.value ?? null)}>
        <Text>select</Text>
      </TouchableOpacity>
    </View>
  );
});

describe('Addroute screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRoutesMock.mockResolvedValue([]);
  });

  it('shows alert when submitting without selections (BC-005)', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(<Addroute />);

    await act(async () => {
      fireEvent.press(getByText('Submit Route'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Enter all options');
  });

  it('prevents same start and end building (BC-0012)', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getAllByTestId, getByText } = render(<Addroute />);

    const pickers = getAllByTestId('picker');
    await act(async () => {
      fireEvent.press(pickers[0]);
      fireEvent.press(pickers[1]);
      fireEvent.press(getByText('Submit Route'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Invalid Route', 'Start and end buildings cannot be the same.');
  });

  it('deletes a saved route and refreshes list (BC-006, BC-009, BC-0010)', async () => {
    getRoutesMock.mockResolvedValueOnce([
      {
        saved_route_id: 'route-1',
        user_id: 'user-1',
        name: 'Route from A to B',
        start_lat: 1,
        start_lon: 2,
        end_lat: 3,
        end_lon: 4,
        is_accessible: 1,
        length_m: null,
        duration_s: null,
        created_at: '2025-01-01',
      },
    ]);

    const { getByText } = render(<Addroute />);

    await waitFor(() => expect(getRoutesMock).toHaveBeenCalled());

    await act(async () => {
      fireEvent.press(getByText('Delete'));
    });

    expect(deleteRouteMock).toHaveBeenCalledWith('route-1');
    expect(getRoutesMock).toHaveBeenCalledTimes(2);
  });
});
