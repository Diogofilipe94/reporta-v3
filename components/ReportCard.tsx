import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";

type Category = {
  id: number;
  category: string;
  created_at: string;
  updated_at: string;
  pivot: {
    report_id: number;
    category_id: number;
  };
};

type Status = {
  id: number;
  status: string;
  created_at: string;
  updated_at: string;
};

type UserReport = {
  id: number;
  location: string;
  photo: string | null;
  date: string;
  user_id: number;
  status_id: number;
  created_at: string;
  updated_at: string;
  status: Status;
  categories: Category[];
};

export async function ReportCard() {
  const [reports, setReports] = useState<UserReport[]>([]);


  async function fetchReports() {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch('https://reporta.up.railway.app/api/user/reports', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setReports(data.data);
      } else {
        console.error('Error fetching reports:', data.message);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }

}
