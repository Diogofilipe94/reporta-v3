
import CustomTabBar from '@/components/CustomTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';


type UserReports = {
  user_id: number;
  status_id: Status;
  location: string;
  photo: string;
  date: string;
}

type Status = {
  id: number;
  status: string;
}


export default function HomeScreen() {
  const [reports, setReports] = useState<UserReports[]>([]);


  useEffect(() => {
    getReportInfo()
  }
  , []);

  async function getReportInfo() {
    const token = await AsyncStorage.getItem('token');

    const response  = await fetch('http://127.0.0.1:8000/api/user/reports', {
      method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setReports(data);
      console.log(data);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo </Text>

        <Text style={styles.title}>Relatórios</Text>
        {reports.map((report, index) => (
          <View key={index}>
            <Text>{report.location}</Text>
            <Text>{report.date}</Text>
            <Text>{report.status_id}</Text>
            <Text>{report.photo}</Text>
          </View>
        ))}
      </View>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
  },
});
