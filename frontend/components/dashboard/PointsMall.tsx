import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  ShoppingCart,
  Gift,
  Star,
  Coins,
  Package,
  Sparkles
} from 'lucide-react';
import { Reward } from '@/lib/types/points';
import { useMallItems, useRedeemItem } from '@/hooks/useMallRedemption';

interface PointsMallProps {
  currentPoints: number;
}

export const PointsMall = memo<PointsMallProps>(({ currentPoints }) => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 使用真实API获取商品数据
  const { data: mallItems, error } = useMallItems(selectedCategory === 'all' ? undefined : selectedCategory);
  const redeemMutation = useRedeemItem();

  const isLoading = !mallItems && !error;

  const categories = [
    { id: 'all', name: '全部', icon: Package },
    { id: 'food', name: '美食', icon: Gift },
    { id: 'entertainment', name: '娱乐', icon: Star },
    { id: 'shopping', name: '购物', icon: ShoppingCart },
    { id: 'health', name: '健康', icon: Sparkles },
    { id: 'education', name: '教育', icon: Gift },
    { id: 'tech', name: '数码', icon: Package }
  ];

  // 转换API数据为Reward格式
  const convertMallItemToReward = (item: any): Reward => ({
    id: item.id,
    name: item.name,
    description: item.description,
    cost: item.points_cost,
    icon: getIconForCategory(item.category),
    category: item.category,
    available: item.is_available && item.stock > 0,
    stock: item.stock,
    popularity: 80 // 默认值
  });

  const getIconForCategory = (category: string): string => {
    const iconMap: Record<string, string> = {
      'gift_card': '🎁',
      'food': '☕',
      'book': '📚',
      'electronics': '🖱️',
      'activity': '🍽️'
    };
    return iconMap[category] || '🎁';
  };

  // 使用API数据
  const displayRewards = mallItems ? mallItems.map(convertMallItemToReward) : [];

  const filteredRewards = selectedCategory === 'all'
    ? displayRewards
    : displayRewards.filter(reward => reward.category === selectedCategory);

  const handleRedeem = (reward: Reward) => {
    if (currentPoints < reward.cost) {
      toast({
        title: "积分不足",
        description: `兑换 ${reward.name} 需要 ${reward.cost} 积分，您当前有 ${currentPoints} 积分`,
        variant: "destructive",
      });
      return;
    }

    if (!reward.available) {
      toast({
        title: "商品缺货",
        description: `${reward.name} 暂时缺货，请选择其他商品`,
        variant: "destructive",
      });
      return;
    }

    // 调用兑换API
    redeemMutation.mutate({
      item_id: reward.id,
      delivery_info: {} // 可以根据需要添加配送信息
    });
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">加载商品中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">加载商品失败</p>
              <Button onClick={() => window.location.reload()}>重试</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center"
            >
              <Icon className="mr-1 h-4 w-4" />
              {category.name}
            </Button>
          );
        })}
      </div>

      {/* 奖励商品网格 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRewards.map((reward) => (
          <Card key={reward.id} className={`${!reward.available ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{reward.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                    <p className="text-sm text-gray-500">{reward.description}</p>
                  </div>
                </div>
                {reward.popularity && reward.popularity > 80 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    热门
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span className="font-bold text-yellow-600">{reward.cost}</span>
                  </div>
                  {reward.stock !== undefined && (
                    <span className="text-sm text-gray-500">
                      库存: {reward.stock}
                    </span>
                  )}
                </div>
                
                <Button
                  className="w-full"
                  onClick={() => handleRedeem(reward)}
                  disabled={!reward.available || currentPoints < reward.cost || redeemMutation.isPending}
                >
                  {redeemMutation.isPending ? '兑换中...' :
                   !reward.available ? '缺货' :
                   currentPoints < reward.cost ? '积分不足' : '立即兑换'}
                </Button>
              </div>
            </CardContent>
            
          </Card>
        ))}
      </div>

      {filteredRewards.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>该分类下暂无商品</p>
        </div>
      )}
    </div>
  );
});

PointsMall.displayName = 'PointsMall';
