module.exports = {
  presets: ['module:@react-native/babel-preset'],
   plugins: [
     'react-native-worklets/plugin',
     [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            'moti/skeleton': 'moti/skeleton/react-native-linear-gradient',
          },
        },
      ],
      [
      "module:react-native-dotenv",
      {
        "moduleName": "@env",
        "path": ".env",
      }
    ]
  ],
};
