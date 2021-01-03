import React from 'react';
import {
  StyleSheet,
  Keyboard,
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import {Picker} from '@react-native-community/picker';
import Clipboard from '@react-native-community/clipboard';
import {read_file, get_password} from './util.js';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      records: [],
      selected_service: 0,
      selected_salt: 0,
      password_info: '',
      master_password: '',
      timer: null,
    };
    this.handleServiceChange.bind(this);
    this.handleSaltChange.bind(this);
    this.handleChangeMasterPassword.bind(this);
    this.handleGeneratePassword.bind(this);
  }

  async componentDidMount() {
    await read_file().then((records) => {
      this.setState({
        records: records,
      });
    });
  }

  componentWillUnmount() {
    Clipboard.setString('');
  }

  handleServiceChange(value) {
    this.setState({
      selected_salt: 0,
      selected_service: value,
    });
  }

  handleSaltChange(value) {
    this.setState({
      selected_salt: value,
    });
  }

  handleChangeMasterPassword(value) {
    this.setState({
      master_password: value,
    });
  }

  handleGeneratePassword() {
    if (this.state.timer) {
      clearTimeout(this.state.timer);
    }
    const master_password = this.state.master_password;
    const record = this.state.records[this.state.selected_service];
    const salt = record.salts[this.state.selected_salt];
    const password_length = record.password_length;
    const has_capital = record.has_capital;
    const has_numeral = record.has_numeral;
    const symbols = record.symbols;
    const password = get_password(
      salt,
      master_password,
      password_length,
      has_capital,
      has_numeral,
      symbols,
    );
    Clipboard.setString(password);
    const timer = setTimeout(() => {
      Clipboard.setString('');
      this.setState({
        password_info: 'パスワードがクリップボードから消去されました。',
        timer: null,
      });
    }, 30000);
    this.setState({
      master_password: '',
      timer: timer,
      password_info:
        'パスワードがクリップボードにコピーされました。\n30秒経過すると消去されます。',
    });
    this.masterPasswordInput.blur();
  }

  handleClearPassword() {
    Clipboard.setString('');
  }

  render() {
    return (
      <>
        <StatusBar barStyle={'dark-content'} />
        <SafeAreaView style={styles.base}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
            style={styles.base}>
            <View style={styles.content} keyboardShouldPersistTaps={'never'}>
              <Picker
                selectedValue={this.state.selected_service}
                onValueChange={(value) => this.handleServiceChange(value)}>
                {this.state.records.map((r, i) => {
                  return (
                    <Picker.Item label={r.service_name} value={i} key={i} />
                  );
                })}
              </Picker>
              <Text style={styles.serviceInfo} selectable={true}>
                {this.state.records[this.state.selected_service]
                  ? this.state.records[this.state.selected_service].service_info
                  : ''}
              </Text>
              {this.state.records[this.state.selected_service] ? (
                <Picker
                  selectedValue={this.state.selected_salt}
                  style={styles.picker}
                  onValueChange={(value) => this.handleSaltChange(value)}>
                  {this.state.records[this.state.selected_service].salts.map(
                    (s, i) => {
                      return (
                        <Picker.Item
                          label={
                            i ? i + 'つ前のパスワード' : '現在のパスワード'
                          }
                          value={i}
                          key={i}
                        />
                      );
                    },
                  )}
                </Picker>
              ) : (
                <Text />
              )}
              <TextInput
                secureTextEntry={true}
                autoCompleteType={'off'}
                autoCorrect={false}
                placeholder={'マスターパスワード'}
                style={styles.masterPasswordInput}
                value={this.state.master_password}
                ref={(input) => {
                  this.masterPasswordInput = input;
                }}
                onChangeText={(value) => this.handleChangeMasterPassword(value)}
              />
              <Button
                title={'生成'}
                onPress={() => this.handleGeneratePassword()}
              />
              <Text style={styles.passwordInfo}>
                {this.state.password_info}
              </Text>
              <Button
                title={
                  'パスワード消去（アプリを終了する前に必ず押して下さい。）'
                }
                onPress={() => this.handleClearPassword()}
              />
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  content: {
    padding: 5,
    flex: 1,
  },
  picker: {
    margin: 5,
  },
  serviceInfo: {
    borderWidth: 1,
  },
  masterPasswordInput: {
    borderWidth: 1,
    padding: 5,
    margin: 5,
  },
  passwordInfo: {
    color: 'orange',
  },
});

export default App;
