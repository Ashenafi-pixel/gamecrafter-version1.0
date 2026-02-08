import { Card, CardHeader, CardTitle, CardContent } from '../../../../ui/Card';
import { Progress } from '../../../../ui/Progress';

interface RTPSplitCardProps {
  baseRTP: number;
  featuresRTP: number;
}

export function RTPSplitCard({ baseRTP, featuresRTP }: RTPSplitCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm uw:text-3xl font-medium flex items-center gap-2">
          RTP Split
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm uw:text-2xl text-gray-600">Base Game</span>
            <span className="font-semibold uw:text-2xl">{baseRTP}%</span>
          </div>
          <Progress value={baseRTP} className="h-2" />
          <div className="flex justify-between items-center">
            <span className="text-sm uw:text-2xl text-gray-600">Features</span>
            <span className="font-semibold uw:text-2xl">{featuresRTP}%</span>
          </div>
          <Progress value={featuresRTP} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
