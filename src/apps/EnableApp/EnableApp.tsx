import { combineReducers, Store } from '@reduxjs/toolkit';
import React, { FC } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

// Components
import Fonts from '../../components/Fonts';
import ThemeProvider from '../../components/ThemeProvider';

// Features
import { reducer as accountsReducer } from '../../features/accounts';
import { reducer as applicationReducer } from '../../features/application';
import { reducer as messagesReducer } from '../../features/messages';
import { reducer as networksReducer } from '../../features/networks';
import { reducer as sessionsReducer } from '../../features/sessions';
import { reducer as settingsReducer } from '../../features/settings';

// Pages
import EnablePage from '../../pages/EnablePage';

// Types
import { IAppProps, IMainRootState } from '../../types';

// Utils
import { makeStore } from '../../utils';

const EnableApp: FC<IAppProps> = ({ i18next, initialColorMode }: IAppProps) => {
  const store: Store<IMainRootState> = makeStore<IMainRootState>(
    combineReducers({
      accounts: accountsReducer,
      application: applicationReducer,
      messages: messagesReducer,
      networks: networksReducer,
      sessions: sessionsReducer,
      settings: settingsReducer,
    })
  );

  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18next}>
        <ThemeProvider initialColorMode={initialColorMode}>
          <Fonts />
          <EnablePage />
        </ThemeProvider>
      </I18nextProvider>
    </Provider>
  );
};

export default EnableApp;