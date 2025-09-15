export interface StatsResponse {
  today: {
    total: number;
    sex: {
      male: number;
      female: number;
    };
    type: {
      fresh_stillbirth: number;
      macerated_stillbirth: number;
    };
  };
  monthly: {
    month: string;
    total: number;
    avgWeight: number;
    sex: {
      male: number;
      female: number;
    };
    type: {
      fresh: number;
      macerated: number;
    };
    place: {
      facility: number;
      home: number;
    };
  }[];
}
